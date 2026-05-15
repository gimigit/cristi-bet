"""
cristi-bet — Bet Settler
Rulat de launchd 4x/zi (via com.cristibet.settle.plist).
Verifică rezultatele și decontează pariurile OPEN.
"""
import os, re, httpx
from typing import Optional
from supabase import create_client
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

ODDS_API_KEY  = os.environ.get("ODDS_API_KEY", "")
SUPABASE_URL  = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY  = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not all([ODDS_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    raise RuntimeError("Missing required env vars — check .env.local")

db = create_client(SUPABASE_URL, SUPABASE_KEY)

# The Odds API sport keys — trebuie să corespundă cu cele din active_sports
# Mapped by sport OR by league (e.g., "soccer" + "EPL" -> "soccer_epl")
SPORT_KEYS = {
    # Soccer leagues
    "soccer_epl":                "soccer_gbr_bql",
    "soccer_bundesliga":         "soccer_deu_bundesliga",
    "soccer_esp-la-liga":        "soccer_esp_la_liga",
    "soccer_ita-serie-a":        "soccer_italy_serie_a",  # CORRECT: not soccer_ita-serie_a
    "soccer_fra-ligue-1":        "soccer_fra_ligue_1",
    # Major US sports
    "basketball_nba":            "basketball_nba",
    "baseball_mlb":              "baseball_mlb",
    "icehockey_nhl":             "icehockey_nhl",
    "americanfootball_nfl":      "americanfootball_nfl",
    # Tennis
    "tennis_atp_major":          "tennis_grand_slam",
    "tennis_wta_major":          "tennis_grand_slam_wta",
    # Combat
    "mma_mma":                   "mma_mma",
}

# League display name → sport key (for logging/comparison)
LEAGUE_TO_SPORT_KEY = {
    "EPL":               "soccer_epl",
    "Premier League":    "soccer_epl",
    "Bundesliga":        "soccer_bundesliga",
    "La Liga":           "soccer_esp-la-liga",
    "Serie A":           "soccer_ita-serie-a",
    "Ligue 1":           "soccer_fra-ligue-1",
    "NBA":               "basketball_nba",
    "MLB":               "baseball_mlb",
    "NHL":               "icehockey_nhl",
    "NFL":               "americanfootball_nfl",
}


def fetch_scores(sport_key: str) -> list:
    try:
        r = httpx.get(
            f"https://api.the-odds-api.com/v4/sports/{sport_key}/scores/",
            params={"apiKey": ODDS_API_KEY, "daysFrom": 3},
            timeout=15,
        )
        return r.json() if r.status_code == 200 else []
    except Exception as e:
        print(f"  Scores fetch failed for {sport_key}: {e}")
        return []


def _tokens(text: str) -> set[str]:
    """Split text into normalized tokens for safe comparison."""
    return {t.strip().lower() for t in re.split(r'[^a-z0-9]+', text.lower()) if t.strip()}

def teams_match(bet_event: str, home: str, away: str) -> bool:
    """
    Strict team match: both teams must appear as distinct tokens in the event string.
    This prevents 'Man Utd' from matching 'Manchester United Reserves'.
    """
    ev_tokens = _tokens(bet_event)
    home_tokens = _tokens(home)
    away_tokens = _tokens(away)
    # Both team names must appear with at least 2 tokens each (avoid single-char noise)
    home_ok = len(home_tokens) >= 1 and home_tokens.issubset(ev_tokens)
    away_ok = len(away_tokens) >= 1 and away_tokens.issubset(ev_tokens)
    return home_ok and away_ok


def determine_winner(game: dict) -> Optional[str]:  # type: ignore
    scores = game.get("scores") or []
    home   = next((s for s in scores if s["name"] == game["home_team"]), None)
    away   = next((s for s in scores if s["name"] == game["away_team"]), None)
    if not home or not away:
        return None
    try:
        hs = int(home["score"])
        as_ = int(away["score"])
        if hs > as_: return game["home_team"]
        if as_ > hs: return game["away_team"]
        return "DRAW"
    except Exception:
        return None


def settle(bet: dict, winner: str):
    selection = bet["selection"].lower()
    won       = (winner == "DRAW" and "draw" in selection) \
                or (winner and winner.lower() in selection)
    status    = "WON" if won else "LOST"
    pnl       = round(float(bet["stake"]) * (float(bet["odds"]) - 1), 2) if won \
                else -float(bet["stake"])

    db.table("bets").update({
        "status":     status,
        "pnl":        pnl,
        "settled_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", bet["id"]).execute()

    last   = db.table("bankroll_history").select("balance") \
        .order("recorded_at", desc=True).limit(1).execute()
    new_bal = round(float(last.data[0]["balance"]) + pnl, 2)
    db.table("bankroll_history").insert({"balance": new_bal}).execute()

    icon = "✅" if won else "❌"
    print(f"  {icon} {bet['id']} → {status} | P&L: €{pnl:+.2f} | Bankroll: €{new_bal:.2f}")


def run():
    print(f"\n{'='*50}")
    print(f"cristi-bet Settle — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'='*50}")

    open_bets = db.table("bets").select("*").eq("status", "OPEN").execute().data
    now       = datetime.now(timezone.utc)
    settled   = 0

    if not open_bets:
        print("No open bets to settle.")
        return

    print(f"Checking {len(open_bets)} open bets...")

    for bet in open_bets:
        try:
            event_dt = datetime.fromisoformat(bet["event_date"].replace("Z", "+00:00"))
        except Exception:
            print(f"  ⚠️  Invalid event_date for {bet['id']}: {bet['event_date']}")
            continue

        # Skip dacă nu au trecut 3 ore de la start
        if event_dt + timedelta(hours=3) > now:
            continue

        # Resolve to The Odds API key: league -> sport_key -> API key
        league   = bet.get("league", "")
        sport_key = LEAGUE_TO_SPORT_KEY.get(league) or bet["sport"]
        api_key   = SPORT_KEYS.get(sport_key, sport_key)  # fallback to raw key

        # Fetch scores using the real API key
        for game in fetch_scores(api_key):
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
