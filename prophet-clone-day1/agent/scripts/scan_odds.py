"""
ProphetAI — Odds Scanner
Rulat de launchd de 6x/zi (via com.prophetai.scan.plist).

Lecții din autorul original (Reddit):
- Opus e singurul model consistent la pasul de decizie
- GPT refuză 1/2, Minimax halucinează și otrăvește ledger-ul
- Python wrapper de validare ÎNAINTE de orice scriere în DB
- Cost per run: ~$0.10-0.20 pe Opus
"""
import os, json, httpx, anthropic
from supabase import create_client
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

ODDS_API_KEY  = os.environ["ODDS_API_KEY"]
SUPABASE_URL  = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY  = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ANTHROPIC_KEY = os.environ["ANTHROPIC_API_KEY"]

BANKROLL_START   = 10.0
MAX_STAKE_PCT    = 0.10
ODDS_MIN         = 1.70
ODDS_MAX         = 2.80
MAX_EXPOSURE_PCT = 0.60

db     = create_client(SUPABASE_URL, SUPABASE_KEY)
claude = anthropic.Anthropic(api_key=ANTHROPIC_KEY)

# ─────────────────────────────────────────────
# DB helpers
# ─────────────────────────────────────────────

def get_active_sports() -> list[str]:
    """Citește sporturile active din Supabase config (setabile din /admin)."""
    try:
        r = db.table("config").select("value").eq("key", "active_sports").execute()
        return r.data[0]["value"] if r.data else ["soccer_epl", "basketball_nba"]
    except Exception as e:
        print(f"⚠️  Config read failed, using defaults: {e}")
        return ["soccer_epl", "basketball_nba"]

def get_bankroll() -> float:
    r = db.table("bankroll_history").select("balance") \
          .order("recorded_at", desc=True).limit(1).execute()
    return float(r.data[0]["balance"]) if r.data else BANKROLL_START

def get_open_exposure() -> float:
    r = db.table("bets").select("stake").eq("status", "OPEN").execute()
    return sum(float(b["stake"]) for b in r.data)

def get_next_id() -> str:
    r = db.table("bets").select("id", count="exact").execute()
    return f"PROP-{(r.count or 0) + 1:03d}"

# ─────────────────────────────────────────────
# Validare — Python wrapper de protecție
# Împiedică AI-ul să halucineze sau să otrăvească ledger-ul.
# Inspirat din comentariile autorului ProphetAI original.
# ─────────────────────────────────────────────

def validate_bet(result: dict, max_stake: float) -> tuple[bool, str]:
    # Câmpuri obligatorii
    required = ["event", "selection", "sport", "league", "market",
                "event_date", "odds", "stake", "confidence", "rationale"]
    for field in required:
        if field not in result or result[field] is None or result[field] == "":
            return False, f"Missing or empty field: {field}"

    # Odds în sweet spot
    try:
        odds = float(result["odds"])
    except (ValueError, TypeError):
        return False, f"Invalid odds value: {result['odds']}"
    if not (ODDS_MIN <= odds <= ODDS_MAX):
        return False, f"Odds {odds} outside sweet spot [{ODDS_MIN}-{ODDS_MAX}]"

    # Stake valid
    try:
        stake = float(result["stake"])
    except (ValueError, TypeError):
        return False, f"Invalid stake value: {result['stake']}"
    if stake < 0.20:
        return False, f"Stake {stake} too small (min £0.20)"
    if stake > max_stake:
        return False, f"Stake {stake} exceeds max allowed {max_stake:.2f}"

    # Confidence valid (50-99)
    try:
        conf = int(result["confidence"])
        if not (50 <= conf <= 99):
            raise ValueError
    except (ValueError, TypeError):
        return False, f"Confidence {result['confidence']} invalid (expected 50-99)"

    # Anti-duplicat — același eveniment + selecție deja OPEN?
    try:
        existing = db.table("bets").select("id") \
                     .eq("event", result["event"]) \
                     .eq("selection", result["selection"]) \
                     .eq("status", "OPEN").execute()
        if existing.data:
            return False, f"Duplicate OPEN bet: {result['event']} — {result['selection']}"
    except Exception as e:
        return False, f"Duplicate check failed: {e}"

    # Rationale minim (anti-halucinare lazy)
    if len(str(result.get("rationale", ""))) < 30:
        return False, "Rationale too short — possible hallucination"

    return True, "ok"

# ─────────────────────────────────────────────
# Odds API
# ─────────────────────────────────────────────

def fetch_odds(sport: str) -> list:
    try:
        r = httpx.get(
            f"https://api.the-odds-api.com/v4/sports/{sport}/odds/",
            params={
                "apiKey": ODDS_API_KEY,
                "regions": "uk,eu",
                "markets": "h2h",
                "oddsFormat": "decimal",
                "dateFormat": "iso"
            },
            timeout=15
        )
        remaining = r.headers.get("x-requests-remaining", "?")
        print(f"  {sport}: {len(r.json()) if r.status_code == 200 else 'ERROR'} games | API remaining: {remaining}")
        return r.json() if r.status_code == 200 else []
    except Exception as e:
        print(f"  {sport}: fetch failed — {e}")
        return []

def simplify_odds(raw: list) -> list:
    """Simplifică răspunsul API pentru prompt mai scurt → costuri mai mici."""
    simplified = []
    for game in raw[:8]:
        best_odds: dict = {}
        for bookie in game.get("bookmakers", [])[:3]:
            for market in bookie.get("markets", []):
                if market["key"] == "h2h":
                    for outcome in market["outcomes"]:
                        name  = outcome["name"]
                        price = outcome["price"]
                        if name not in best_odds or price > best_odds[name]:
                            best_odds[name] = price
        # Filtrare rapidă: păstrăm doar jocuri cu cote în sweet spot
        has_value = any(ODDS_MIN <= p <= ODDS_MAX for p in best_odds.values())
        if best_odds and has_value:
            simplified.append({
                "event":    f"{game['home_team']} vs {game['away_team']}",
                "commence": game["commence_time"],
                "sport":    game["sport_key"],
                "odds":     best_odds
            })
    return simplified

# ─────────────────────────────────────────────
# Claude Opus — decizie pariu
# ─────────────────────────────────────────────

def ask_claude(matches: list, bankroll: float, exposure: float, max_stake: float) -> dict:
    """
    Folosim Claude Opus — singurul model consistent pentru acest task.
    Sonnet și GPT refuză sau halucinează la pasul de decizie.
    Cost: ~$0.10-0.20 per apel pe Opus.
    """
    prompt = f"""You are ProphetAI — an autonomous sports betting AI managing a simulated bankroll.

BANKROLL: £{bankroll:.2f} | OPEN EXPOSURE: £{exposure:.2f} | MAX STAKE: £{max_stake:.2f}
ODDS SWEET SPOT: {ODDS_MIN}–{ODDS_MAX}

UPCOMING MATCHES WITH VALUE ODDS:
{json.dumps(matches, indent=2)}

RULES:
- Find ONE bet with genuine edge. If nothing stands out clearly, output NO_BET.
- Only bet odds strictly between {ODDS_MIN} and {ODDS_MAX}.
- Stake sizing: HIGH confidence (80%+) = 8-10% bankroll. MEDIUM (65-79%) = 4-6%. LOW (50-64%) = 2-3%.
- Minimum stake £0.20, maximum £{max_stake:.2f}.
- It is ALWAYS better to skip than to force a marginal bet.
- Never bet on a team/event you've already bet on in an open position.

Respond ONLY with valid JSON (no markdown, no backticks):
{{
  "decision": "BET",
  "event": "Team A vs Team B",
  "selection": "Team A to Win",
  "sport": "soccer",
  "league": "EPL",
  "market": "ML",
  "event_date": "2026-05-10T19:45:00Z",
  "odds": 2.10,
  "stake": 1.00,
  "confidence": 72,
  "rationale": "2-3 punchy sentences. Use CAPS for key signals. Be specific.",
  "reason_no_bet": null
}}

Or if skipping:
{{
  "decision": "NO_BET",
  "reason_no_bet": "Brief reason why nothing qualifies today."
}}"""

    resp = claude.messages.create(
        model="claude-opus-4-20250514",  # Opus — singurul consistent pentru decizie
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}]
    )

    text = resp.content[0].text.strip()

    # Strip markdown fences dacă modelul le adaugă
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    return json.loads(text)

# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

def run():
    print(f"\n{'='*50}")
    print(f"ProphetAI Scan — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'='*50}")

    bankroll = get_bankroll()
    exposure = get_open_exposure()
    print(f"Bankroll: £{bankroll:.2f} | Exposure: £{exposure:.2f}")

    if bankroll > 0 and exposure / bankroll > MAX_EXPOSURE_PCT:
        print(f"⚠️  Exposure {exposure:.2f}/{bankroll:.2f} > {MAX_EXPOSURE_PCT*100}% — skipping scan.")
        return

    sports      = get_active_sports()
    all_matches = []

    print(f"\nFetching odds for: {', '.join(sports)}")
    for sport in sports:
        odds_data = fetch_odds(sport)
        all_matches.extend(simplify_odds(odds_data))

    if not all_matches:
        print("❌ No matches with value odds available.")
        return

    print(f"\n{len(all_matches)} matches with potential value. Asking Claude Opus...")

    max_stake = min(bankroll * MAX_STAKE_PCT, bankroll - exposure)
    max_stake = max(max_stake, 0)

    try:
        result = ask_claude(all_matches, bankroll, exposure, max_stake)
    except json.JSONDecodeError as e:
        print(f"❌ Claude returned invalid JSON: {e}")
        return
    except Exception as e:
        print(f"❌ Claude API error: {e}")
        return

    if result.get("decision") == "NO_BET":
        print(f"⏭️  NO_BET: {result.get('reason_no_bet', 'Nothing qualifies.')}")
        return

    # ── Validare înainte de scriere în DB ──
    valid, reason = validate_bet(result, max_stake)
    if not valid:
        print(f"🛑 Bet rejected by validator: {reason}")
        print(f"   Raw result: {json.dumps(result, indent=2)}")
        return

    bet_id = get_next_id()
    db.table("bets").insert({
        "id":         bet_id,
        "event":      result["event"],
        "selection":  result["selection"],
        "sport":      result["sport"],
        "league":     result["league"],
        "market":     result["market"],
        "event_date": result["event_date"],
        "odds":       float(result["odds"]),
        "stake":      float(result["stake"]),
        "confidence": int(result["confidence"]),
        "rationale":  result["rationale"],
        "status":     "OPEN",
        "placed_at":  datetime.now(timezone.utc).isoformat()
    }).execute()

    print(f"\n✅ {bet_id} placed!")
    print(f"   {result['selection']} @ {result['odds']}")
    print(f"   Stake: £{result['stake']} | Confidence: {result['confidence']}%")
    print(f"   {result['rationale'][:80]}...")

if __name__ == "__main__":
    run()
