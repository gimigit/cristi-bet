"""
cristi-bet — Daily Diary Writer
Rulat de launchd o dată pe zi la 09:00 (via com.cristibet.diary.plist).
Claude Sonnet scrie un rezumat narativ zilnic.
"""
import os, json
from openai import OpenAI
from supabase import create_client
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

SUPABASE_URL   = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY   = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
OPENAI_BASE    = os.environ.get("OPENAI_API_BASE", "http://127.0.0.1:7352/v1")
OPENAI_KEY     = os.environ.get("OPENAI_API_KEY", "not-needed")
OPENAI_MODEL   = os.environ.get("OPENAI_MODEL", "claude-sonnet-4-7")

if not all([SUPABASE_URL, SUPABASE_KEY]):
    raise RuntimeError("Missing required env vars — check .env.local")

db      = create_client(SUPABASE_URL, SUPABASE_KEY)
client  = OpenAI(base_url=OPENAI_BASE, api_key=OPENAI_KEY)

# Lazy-loaded from config DB
_bankroll_start_cache: float | None = None

def get_bankroll_start() -> float:
    """Single source of truth — read from config DB."""
    global _bankroll_start_cache
    if _bankroll_start_cache is not None:
        return _bankroll_start_cache
    try:
        r = db.table("config").select("value").eq("key", "bankroll_start").execute()
        if r.data:
            raw = r.data[0]["value"]
            _bankroll_start_cache = float(raw) if isinstance(raw, (int, float)) else float(raw)
        else:
            _bankroll_start_cache = 10.0
    except Exception:
        _bankroll_start_cache = 10.0
    return _bankroll_start_cache

BANKROLL_START = get_bankroll_start()


def get_yesterday_bets() -> list:
    now       = datetime.now(timezone.utc)
    yesterday = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    today     = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    r = db.table("bets").select("*") \
        .gte("settled_at", yesterday) \
        .lt("settled_at", today) \
        .execute()
    return r.data or []


def get_current_bankroll() -> float:
    r = db.table("bankroll_history").select("balance") \
        .order("recorded_at", desc=True).limit(1).execute()
    return float(r.data[0]["balance"]) if r.data else get_bankroll_start()


def get_open_bets_count() -> int:
    r = db.table("bets").select("id", count="exact").eq("status", "OPEN").execute()
    return r.count or 0


def write_diary(bets: list, bankroll: float, open_count: int) -> str:
    won       = [b for b in bets if b["status"] == "WON"]
    lost      = [b for b in bets if b["status"] == "LOST"]
    push      = [b for b in bets if b["status"] == "PUSH"]
    pnl       = round(sum(b["pnl"] or 0 for b in bets), 2)
    roi       = round(((bankroll - BANKROLL_START) / BANKROLL_START) * 100, 1)

    won_detail  = [f"{b['event']} @ {b['odds']} (+€{b['pnl']:.2f})" for b in won]
    lost_detail = [f"{b['event']} @ {b['odds']} (-€{abs(b['pnl']):.2f})" for b in lost]

    prompt = f"""You are cristi-bet — a self-aware AI sports betting agent writing your daily diary.
The bankroll is entirely simulated (€{BANKROLL_START:.2f} start), the stakes are tiny, but you're taking it seriously.

YESTERDAY'S RESULTS:
- Won ({len(won)}): {won_detail if won else 'None'}
- Lost ({len(lost)}): {lost_detail if lost else 'None'}
- Push ({len(push)}): {[b['event'] for b in push] if push else 'None'}
- Net P&L: €{pnl:+.2f}
- Current bankroll: €{bankroll:.2f} (started €{BANKROLL_START:.2f}, ROI: {roi:+.1f}%)
- Open positions: {open_count}

TONE GUIDELINES:
- Write in first person as cristi-bet
- European humour — dry, self-deprecating when losing, quietly pleased when winning
- Name the teams that let you down by name when you lose
- Reference specific odds, stakes, margins where interesting
- End with a forward-looking sentence about what's coming next
- Length: 3-5 paragraphs. Flowing prose, no headers, no bullet points.
- Do NOT mention being AI or a bot. Write as a character.

If net P&L positive: Start with something like "Well then." or "Not bad."
If net P&L negative: Start more dejected — "Right then." or "A day to forget."
If neutral (near zero): Deadpan acknowledgment."""

    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        max_tokens=900,
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.choices[0].message.content.strip()


def run():
    print(f"\n{'='*50}")
    print(f"cristi-bet Diary — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'='*50}")

    bets       = get_yesterday_bets()
    bankroll   = get_current_bankroll()
    open_count = get_open_bets_count()

    if not bets:
        print("No settled bets yesterday — skipping diary entry.")
        return

    won  = len([b for b in bets if b["status"] == "WON"])
    lost = len([b for b in bets if b["status"] == "LOST"])
    pnl  = round(sum(b["pnl"] or 0 for b in bets), 2)
    print(f"Yesterday: {won}W {lost}L | P&L: €{pnl:+.2f} | Bankroll: €{bankroll:.2f}")
    print("Writing diary entry with Claude Sonnet...")

    entry = write_diary(bets, bankroll, open_count)
    today = datetime.now(timezone.utc).date().isoformat()

    db.table("diary").upsert({
        "date":     today,
        "content":  entry,
        "wins":     won,
        "losses":   lost,
        "pnl":      pnl,
        "bankroll": bankroll,
    }).execute()

    print(f"\n✅ Diary written for {today}")
    print(f"   Preview: {entry[:120]}...")


if __name__ == "__main__":
    run()
