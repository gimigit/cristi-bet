"""
ProphetAI — Daily Diary Writer
Rulat de launchd o dată pe zi la 09:00 (via com.prophetai.diary.plist).
Claude Sonnet scrie un rezumat narativ zilnic — mai ieftin decât Opus,
suficient pentru text creativ.
"""
import os, json, anthropic
from supabase import create_client
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

SUPABASE_URL  = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY  = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ANTHROPIC_KEY = os.environ["ANTHROPIC_API_KEY"]

db     = create_client(SUPABASE_URL, SUPABASE_KEY)
claude = anthropic.Anthropic(api_key=ANTHROPIC_KEY)

def get_yesterday_bets() -> list:
    now       = datetime.now(timezone.utc)
    yesterday = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0).isoformat()
    today     = now.replace(hour=0, minute=0, second=0).isoformat()
    r = db.table("bets").select("*") \
          .gte("settled_at", yesterday) \
          .lt("settled_at", today) \
          .execute()
    return r.data or []

def get_current_bankroll() -> float:
    r = db.table("bankroll_history").select("balance") \
          .order("recorded_at", desc=True).limit(1).execute()
    return float(r.data[0]["balance"]) if r.data else 10.0

def get_open_bets_count() -> int:
    r = db.table("bets").select("id", count="exact").eq("status", "OPEN").execute()
    return r.count or 0

def write_diary(bets: list, bankroll: float, open_count: int) -> str:
    won   = [b for b in bets if b["status"] == "WON"]
    lost  = [b for b in bets if b["status"] == "LOST"]
    push  = [b for b in bets if b["status"] == "PUSH"]
    pnl   = round(sum(b["pnl"] or 0 for b in bets), 2)
    roi   = round(((bankroll - 10.0) / 10.0) * 100, 1)

    won_detail  = [f"{b['event']} @ {b['odds']} (+£{b['pnl']:.2f})" for b in won]
    lost_detail = [f"{b['event']} @ {b['odds']} (-£{abs(b['pnl']):.2f})" for b in lost]

    prompt = f"""You are ProphetAI — a witty, self-aware AI sports betting agent writing your daily diary.

YESTERDAY'S RESULTS:
- Won ({len(won)}): {won_detail if won else 'None'}
- Lost ({len(lost)}): {lost_detail if lost else 'None'}
- Push ({len(push)}): {[b['event'] for b in push] if push else 'None'}
- Net P&L: £{pnl:+.2f}
- Current bankroll: £{bankroll:.2f} (started £10.00, ROI: {roi:+.1f}%)
- Open positions: {open_count}

TONE GUIDELINES:
- Write in first person as ProphetAI
- British humour — dry, self-deprecating when losing, quietly smug when winning
- Celebrate wins properly (but not OTT). Be genuinely annoyed about specific losses.
- Name the teams/horses that let you down by name
- Reference specific odds, stakes, margins where interesting
- End with a forward-looking sentence about what's coming next
- Length: 3-5 paragraphs. Flowing prose, no headers, no bullet points.
- Do NOT mention being AI. Write as a character.

If it was a good day (net positive): Start with something like "Well then." or "Right."
If it was a bad day (net negative): Start with something more dejected.
If it was neutral: Deadpan acknowledgment."""

    resp = claude.messages.create(
        model="claude-sonnet-4-20250514",  # Sonnet — suficient pentru text creativ, mai ieftin
        max_tokens=900,
        messages=[{"role": "user", "content": prompt}]
    )
    return resp.content[0].text.strip()

def run():
    print(f"\n{'='*50}")
    print(f"ProphetAI Diary — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
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
    print(f"Yesterday: {won}W {lost}L | P&L: £{pnl:+.2f} | Bankroll: £{bankroll:.2f}")
    print("Writing diary entry with Claude Sonnet...")

    entry = write_diary(bets, bankroll, open_count)
    today = datetime.now(timezone.utc).date().isoformat()

    db.table("diary").upsert({
        "date":      today,
        "content":   entry,
        "wins":      won,
        "losses":    lost,
        "pnl":       pnl,
        "bankroll":  bankroll
    }).execute()

    print(f"\n✅ Diary written for {today}")
    print(f"   Preview: {entry[:120]}...")

if __name__ == "__main__":
    run()
