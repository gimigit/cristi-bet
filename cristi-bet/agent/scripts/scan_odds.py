"""
cristi-bet — Odds Scanner
Rulat de launchd 6x/zi (via com.cristibet.scan.plist).

Inspirat de ProphetAI original (Reddit):
- Opus pentru decizie (nu refuză și nu halucinează)
- Python validator ÎNAINTE de orice scriere în DB
- Cost: ~$0.10-0.20 per apel pe Opus
"""
import os, json, httpx
from openai import OpenAI
from supabase import create_client
from datetime import datetime, timezone
from dotenv import load_dotenv

# încarcă .env din rădăcina proiectului (nu din agent/)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

ODDS_API_KEY   = os.environ.get("ODDS_API_KEY", "")
SUPABASE_URL   = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY   = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
OPENAI_BASE    = os.environ.get("OPENAI_API_BASE", "http://127.0.0.1:7352/v1")
OPENAI_KEY     = os.environ.get("OPENAI_API_KEY", "not-needed")
OPENAI_MODEL   = os.environ.get("OPENAI_MODEL", "claude-sonnet-4-7")

BANKROLL_START  = 10.0
MAX_STAKE_PCT   = 0.10
ODDS_MIN        = 1.70
ODDS_MAX        = 2.80
MAX_EXPOSURE_PCT = 0.60

if not all([ODDS_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    raise RuntimeError("Missing required env vars — check .env.local")

db      = create_client(SUPABASE_URL, SUPABASE_KEY)
client  = OpenAI(base_url=OPENAI_BASE, api_key=OPENAI_KEY)


# ─────────────────────────────────────────────
# DB helpers
# ─────────────────────────────────────────────

def get_active_sports() -> list[str]:
    """Sporturile active din Supabase config (setabile din /admin)."""
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
    return f"CBT-{(r.count or 0) + 1:03d}"


# ─────────────────────────────────────────────
# Validare — protecție anti-halucinare AI
# ─────────────────────────────────────────────

def validate_bet(result: dict, max_stake: float) -> tuple[bool, str]:
    required = ["event", "selection", "sport", "league", "market",
                "event_date", "odds", "stake", "confidence", "rationale"]
    for field in required:
        if field not in result or result[field] is None or result[field] == "":
            return False, f"Missing or empty field: {field}"

    try:
        odds = float(result["odds"])
    except (ValueError, TypeError):
        return False, f"Invalid odds value: {result['odds']}"
    if not (ODDS_MIN <= odds <= ODDS_MAX):
        return False, f"Odds {odds} outside sweet spot [{ODDS_MIN}-{ODDS_MAX}]"

    try:
        stake = float(result["stake"])
    except (ValueError, TypeError):
        return False, f"Invalid stake value: {result['stake']}"
    if stake < 0.20:
        return False, f"Stake {stake} too small (min €0.20)"
    if stake > max_stake:
        return False, f"Stake {stake} exceeds max allowed €{max_stake:.2f}"

    try:
        conf = int(result["confidence"])
        if not (50 <= conf <= 99):
            raise ValueError
    except (ValueError, TypeError):
        return False, f"Confidence {result['confidence']} invalid (expected 50-99)"

    # Anti-duplicat
    try:
        existing = db.table("bets").select("id") \
            .eq("event", result["event"]) \
            .eq("selection", result["selection"]) \
            .eq("status", "OPEN").execute()
        if existing.data:
            return False, f"Duplicate OPEN bet: {result['event']} — {result['selection']}"
    except Exception as e:
        return False, f"Duplicate check failed: {e}"

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
                "apiKey":      ODDS_API_KEY,
                "regions":     "eu,uk,us",
                "markets":     "h2h",
                "oddsFormat":  "decimal",
                "dateFormat":  "iso",
            },
            timeout=15,
        )
        remaining = r.headers.get("x-requests-remaining", "?")
        count = len(r.json()) if r.status_code == 200 else "ERROR"
        print(f"  {sport}: {count} games | API remaining: {remaining}")
        return r.json() if r.status_code == 200 else []
    except Exception as e:
        print(f"  {sport}: fetch failed — {e}")
        return []


def simplify_odds(raw: list) -> list:
    """Simplifică răspunsul API pentru un prompt mai scurt → cost mai mic."""
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
        has_value = any(ODDS_MIN <= p <= ODDS_MAX for p in best_odds.values())
        if best_odds and has_value:
            simplified.append({
                "event":    f"{game['home_team']} vs {game['away_team']}",
                "commence": game["commence_time"],
                "sport":    game["sport_key"],
                "odds":     best_odds,
            })
    return simplified


# ─────────────────────────────────────────────
# Claude Opus — decizie pariu
# ─────────────────────────────────────────────

def ask_opus(matches: list, bankroll: float, exposure: float, max_stake: float) -> dict:
    prompt = f"""You are cristi-bet's AI betting agent. You scan live odds, find genuine edge, and place simulated bets.

BANKROLL: €{bankroll:.2f} | OPEN EXPOSURE: €{exposure:.2f} | MAX STAKE: €{max_stake:.2f}
ODDS SWEET SPOT: {ODDS_MIN}–{ODDS_MAX}

UPCOMING MATCHES WITH VALUE ODDS:
{json.dumps(matches, indent=2)}

RULES:
- Find ONE bet with genuine edge. If nothing stands out, output NO_BET.
- Only bet odds strictly between {ODDS_MIN} and {ODDS_MAX}.
- Stake sizing: HIGH confidence (80%+) = 8-10% bankroll. MEDIUM (65-79%) = 4-6%. LOW (50-64%) = 2-3%.
- Minimum stake €0.20, maximum €{max_stake:.2f}.
- It is ALWAYS better to skip than to force a marginal bet.
- Never bet on a team/event you've already bet on in an open position.
- league must be a real competition name (e.g. "UEFA Champions League", "NBA", "Premier League").
- sport must be the API sport key (e.g. "soccer", "basketball_nba", "icehockey_nhl").

Respond ONLY with valid JSON (no markdown, no backticks):
{{
  "decision": "BET",
  "event": "Team A vs Team B",
  "selection": "Team A to Win",
  "sport": "soccer",
  "league": "Premier League",
  "market": "h2h",
  "event_date": "2026-05-10T19:45:00Z",
  "odds": 2.10,
  "stake": 0.80,
  "confidence": 72,
  "rationale": "2-3 punchy sentences. Use CAPS for key signals. Be specific.",
  "reason_no_bet": null
}}

Or if skipping:
{{
  "decision": "NO_BET",
  "reason_no_bet": "Brief reason why nothing qualifies today."
}}"""

    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        max_tokens=2500,
        messages=[{"role": "user", "content": prompt}],
    )
    text = resp.choices[0].message.content
    if text is None:
        raise ValueError(f"Model returned empty response. Refusal or block. Response: {resp}")
    text = text.strip()
    # strip markdown fences
    if text.startswith("```"):
        parts = text.split("```")
        text = parts[1] if len(parts) > 1 else text
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

def run():
    print(f"\n{'='*50}")
    print(f"cristi-bet Scan — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'='*50}")

    bankroll = get_bankroll()
    exposure = get_open_exposure()
    print(f"Bankroll: €{bankroll:.2f} | Exposure: €{exposure:.2f}")

    if bankroll > 0 and exposure / bankroll > MAX_EXPOSURE_PCT:
        print(f"⚠️  Exposure {exposure:.2f}/{bankroll:.2f} > {MAX_EXPOSURE_PCT*100}% — skipping scan.")
        return

    sports      = get_active_sports()
    all_matches = []

    print(f"\nFetching odds for: {', '.join(sports)}")
    for sport in sports:
        all_matches.extend(simplify_odds(fetch_odds(sport)))

    if not all_matches:
        print("❌ No matches with value odds available.")
        return

    print(f"\n{len(all_matches)} matches with potential value. Asking Claude Opus...")

    max_stake = min(bankroll * MAX_STAKE_PCT, bankroll - exposure)
    max_stake = max(max_stake, 0)

    try:
        result = ask_opus(all_matches, bankroll, exposure, max_stake)
    except json.JSONDecodeError as e:
        print(f"❌ Opus returned invalid JSON: {e}")
        return
    except Exception as e:
        print(f"❌ Opus API error: {e}")
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
        "placed_at":  datetime.now(timezone.utc).isoformat(),
    }).execute()

    print(f"\n✅ {bet_id} placed!")
    print(f"   {result['selection']} @ {result['odds']}")
    print(f"   Stake: €{result['stake']} | Confidence: {result['confidence']}%")
    print(f"   {result['rationale'][:80]}...")


if __name__ == "__main__":
    run()
