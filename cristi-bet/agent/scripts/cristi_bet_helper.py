"""
cristi-bet Helper — Shared utilities for all scripts.
Used by Odysseus AI when running scheduled tasks.
"""
import os, json, httpx
from typing import Optional
from supabase import create_client
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load env from project root
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env.local'))

ODDS_API_KEY  = os.environ.get("ODDS_API_KEY", "")
SUPABASE_URL  = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY  = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not all([ODDS_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    raise RuntimeError("Missing required env vars")

db = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─── Config ───

def get_config(key: str, default=None):
    try:
        r = db.table("config").select("value").eq("key", key).execute()
        return r.data[0]["value"] if r.data else default
    except Exception:
        return default

def get_active_sports() -> list:
    return get_config("active_sports", ["soccer_epl", "basketball_nba"])

def get_bankroll_start() -> float:
    return float(get_config("bankroll_start", 10.0))

def get_bankroll() -> float:
    r = db.table("bankroll_history").select("balance") \
        .order("recorded_at", desc=True).limit(1).execute()
    return float(r.data[0]["balance"]) if r.data else get_bankroll_start()

def get_open_exposure() -> float:
    r = db.table("bets").select("stake").eq("status", "OPEN").execute()
    return sum(float(b["stake"]) for b in r.data)

def get_next_bet_id() -> str:
    r = db.table("bets").select("id", count="exact").execute()
    return f"CBT-{(r.count or 0) + 1:03d}"

# ─── Odds API ───

def fetch_odds(sport: str) -> list:
    try:
        r = httpx.get(
            f"https://api.the-odds-api.com/v4/sports/{sport}/odds/",
            params={
                "apiKey": ODDS_API_KEY,
                "regions": "eu,uk,us",
                "markets": "h2h",
                "oddsFormat": "decimal",
                "dateFormat": "iso",
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

def simplify_odds(raw: list, max_games: int = 8) -> list:
    """Simplifică răspunsul API — only games with odds in sweet spot range."""
    ODDS_MIN, ODDS_MAX = 1.70, 2.80
    simplified = []
    for game in raw[:max_games]:
        best_odds = {}
        for bookie in game.get("bookmakers", [])[:3]:
            for market in bookie.get("markets", []):
                if market["key"] == "h2h":
                    for outcome in market["outcomes"]:
                        name = outcome["name"]
                        price = outcome["price"]
                        if name not in best_odds or price > best_odds[name]:
                            best_odds[name] = price
        has_value = any(ODDS_MIN <= p <= ODDS_MAX for p in best_odds.values())
        if best_odds and has_value:
            simplified.append({
                "event": f"{game['home_team']} vs {game['away_team']}",
                "commence": game["commence_time"],
                "sport": game["sport_key"],
                "league": game.get("sport_title", sport_key_to_league(game["sport_key"])),
                "home": game["home_team"],
                "away": game["away_team"],
                "odds": best_odds,
            })
    return simplified

def sport_key_to_league(sport_key: str) -> str:
    mapping = {
        "soccer_epl": "EPL",
        "soccer_gbr_bql": "EPL",
        "soccer_deu_bundesliga": "Bundesliga",
        "soccer_esp_la_liga": "La Liga",
        "soccer_italy_serie_a": "Serie A",
        "soccer_fra_ligue_one": "Ligue 1",
        "soccer_fra_ligue_1": "Ligue 1",
        "soccer_uefa_champs_league": "UEFA Champions League",
        "soccer_uefa_europa_league": "UEFA Europa League",
        "basketball_nba": "NBA",
        "americanfootball_nfl": "NFL",
        "baseball_mlb": "MLB",
        "icehockey_nhl": "NHL",
    }
    return mapping.get(sport_key, sport_key)

# ─── Bets ───

def place_bet(event: str, selection: str, sport: str, league: str, market: str,
              event_date: str, odds: float, confidence: int, stake: float,
              rationale: str) -> Optional[str]:
    """Plasează un pariu în Supabase. Returnează ID-ul bet-ului sau None."""
    bet_id = get_next_bet_id()
    try:
        db.table("bets").insert({
            "id": bet_id,
            "event": event,
            "selection": selection,
            "sport": sport,
            "league": league,
            "market": market,
            "event_date": event_date,
            "odds": round(odds, 2),
            "confidence": confidence,
            "stake": round(stake, 2),
            "status": "OPEN",
            "rationale": rationale,
            "placed_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
        return bet_id
    except Exception as e:
        print(f"  ❌ Failed to place bet {bet_id}: {e}")
        return None

# ─── Scans ───

def log_scan(status: str, leagues_scanned: int = 0, bet_id: Optional[str] = None, reason: Optional[str] = None):
    """Loghează o scanare în tabela scans."""
    try:
        db.table("scans").insert({
            "status": status,
            "leagues_scanned": leagues_scanned,
            "bet_id": bet_id,
            "reason": reason,
        }).execute()
    except Exception as e:
        print(f"  ⚠️  Failed to log scan: {e}")

# ─── Settle ───

LEAGUE_TO_SPORT_KEY = {
    "EPL": "soccer_epl",
    "Premier League": "soccer_epl",
    "Bundesliga": "soccer_germany_bundesliga",
    "La Liga": "soccer_esp_la_liga",
    "Serie A": "soccer_italy_serie_a",
    "Ligue 1": "soccer_fra_ligue_one",
    "NBA": "basketball_nba",
    "MLB": "baseball_mlb",
    "NHL": "icehockey_nhl",
    "NFL": "americanfootball_nfl",
}

SPORT_KEYS = {
    "soccer_epl": "soccer_gbr_bql",
    "soccer_germany_bundesliga": "soccer_deu_bundesliga",
    "soccer_esp_la_liga": "soccer_esp_la_liga",
    "soccer_italy_serie_a": "soccer_italy_serie_a",
    "soccer_fra_ligue_one": "soccer_fra_ligue_one",
    "basketball_nba": "basketball_nba",
    "baseball_mlb": "baseball_mlb",
    "icehockey_nhl": "icehockey_nhl",
    "americanfootball_nfl": "americanfootball_nfl",
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

# ─── Diary ───

def get_yesterday_bets():
    now = datetime.now(timezone.utc)
    yesterday = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    r = db.table("bets").select("*") \
        .gte("settled_at", yesterday) \
        .lt("settled_at", today) \
        .execute()
    return r.data or []

def get_open_bets_count() -> int:
    r = db.table("bets").select("id", count="exact").eq("status", "OPEN").execute()
    return r.count or 0

# For timedelta in get_yesterday_bets
from datetime import timedelta
