"""
ProphetAI — Bet Settler
Rulat de launchd de 4x/zi (via com.prophetai.settle.plist).
Verifică rezultatele și decontează pariurile OPEN.
"""
import os, httpx
from supabase import create_client
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

ODDS_API_KEY = os.environ["ODDS_API_KEY"]
SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

db = create_client(SUPABASE_URL, SUPABASE_KEY)

SPORT_MAP = {
    "soccer":     "soccer_epl",
    "basketball": "basketball_nba",
    "baseball":   "baseball_mlb",
    "icehockey":  "icehockey_nhl",
}

def fetch_scores(sport_key: str) -> list:
    try:
        r = httpx.get(
            f"https://api.the-odds-api.com/v4/sports/{sport_key}/scores/",
            params={"apiKey": ODDS_API_KEY, "daysFrom": 3},
            timeout=15
        )
        return r.json() if r.status_code == 200 else []
    except Exception as e:
        print(f"  Scores fetch failed for {sport_key}: {e}")
        return []

def teams_match(bet_event: str, home: str, away: str) -> bool:
    ev = bet_event.lower()
    return home.lower() in ev or away.lower() in ev

def determine_winner(game: dict) -> str | None:
    scores = game.get("scores") or []
    home = next((s for s in scores if s["name"] == game["home_team"]), None)
    away = next((s for s in scores if s["name"] == game["away_team"]), None)
    if not home or not away:
        return None
    try:
        hs, as_ = int(home["score"]), int(away["score"])
        if hs > as_: return game["home_team"]
        if as_ > hs: return game["away_team"]
        return "DRAW"
    except Exception:
        return None

def settle(bet: dict, winner: str):
    selection = bet["selection"].lower()
    won = ("draw" in selection) if winner == "DRAW" \
          else (winner and winner.lower() in selection)
    status = "WON" if won else "LOST"
    pnl    = round(float(bet["stake"]) * (float(bet["odds"]) - 1), 2) if won \
             else -float(bet["stake"])

    db.table("bets").update({
        "status":     status,
        "pnl":        pnl,
        "settled_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", bet["id"]).execute()

    # Update bankroll history
    last = db.table("bankroll_history").select("balance") \
              .order("recorded_at", desc=True).limit(1).execute()
    new_bal = round(float(last.data[0]["balance"]) + pnl, 2)
    db.table("bankroll_history").insert({"balance": new_bal}).execute()

    icon = "✅" if won else "❌"
    print(f"  {icon} {bet['id']} → {status} | P&L: £{pnl:+.2f} | Bankroll: £{new_bal:.2f}")

def run():
    print(f"\n{'='*50}")
    print(f"ProphetAI Settle — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'='*50}")

    open_bets = db.table("bets").select("*").eq("status", "OPEN").execute().data
    now       = datetime.now(timezone.utc)
    settled   = 0

    if not open_bets:
        print("No open bets to settle.")
        return

    print(f"Checking {len(open_bets)} open bets...")

    for bet in open_bets:
        event_dt = datetime.fromisoformat(bet["event_date"].replace("Z", "+00:00"))

        # Skip dacă meciul nu s-a terminat (buffer 3h după start)
        if event_dt + timedelta(hours=3) > now:
            continue

        sport_key = SPORT_MAP.get(bet["sport"])
        if not sport_key:
            print(f"  ⚠️  Unknown sport: {bet['sport']} for {bet['id']}")
            continue

        for game in fetch_scores(sport_key):
            if not game.get("completed"):
                continue
            if teams_match(bet["event"], game["home_team"], game["away_team"]):
                winner = determine_winner(game)
                if winner:
                    settle(bet, winner)
                    settled += 1
                    break

    print(f"\nSettled {settled}/{len(open_bets)} open bets.")

if __name__ == "__main__":
    run()
