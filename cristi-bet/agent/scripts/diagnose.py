#!/usr/bin/env python3
import os, httpx
from supabase import create_client
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
ODDS_API_KEY = os.environ.get('ODDS_API_KEY')
SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
db = create_client(SUPABASE_URL, SUPABASE_KEY)

open_bets = db.table('bets').select('*').eq('status', 'OPEN').execute()
print(f'Open bets: {len(open_bets.data)}')
for b in open_bets.data:
    ed = b['event_date']
    event_dt = datetime.fromisoformat(ed.replace('Z', '+00:00')) if 'T' in ed else datetime.fromisoformat(ed)
    now = datetime.now(timezone.utc)
    print(f'  - {b["id"]}: {b["sport"]} | {b["event"]} | odds={b["odds"]} stake={b["stake"]} | event={ed}')
    if event_dt + timedelta(hours=3) > now:
        age = (now - event_dt).total_seconds() / 3600
        print(f'    Age: {age:.1f} hours (<3h, will wait)')
    else:
        age = (now - event_dt).total_seconds() / 3600
        print(f'    Age: {age:.1f} hours (>=3h, should check)')

last = db.table('bankroll_history').select('balance').order('recorded_at', desc=True).limit(1).execute()
print(f'Current bankroll: EUR {last.data[0]["balance"]:.2f}')

if ODDS_API_KEY and len(ODDS_API_KEY) > 20:
    for b in open_bets.data:
        sport_key = 'soccer_epl'
        try:
            with httpx.Client(timeout=15) as c:
                r = c.get(f'https://api.the-odds-api.com/v4/sports/{sport_key}/scores/', params={'apiKey': ODDS_API_KEY, 'daysFrom': 3})
                print(f'Scores API: {r.status_code}')
                if r.status_code == 200:
                    games = r.json()
                    print(f'  Games returned: {len(games)}')
                    for g in games:
                        if g.get('home_team') and g.get('away_team'):
                            comp = False
                            if g['home_team'].lower() in b['event'].lower() or g['away_team'].lower() in b['event'].lower():
                                comp = True
                            print(f'    {g["home_team"]} vs {g["away_team"]} - completed:{g.get("completed", False)} scores:{g.get("scores")} match:{comp}')
        except Exception as e:
            print(f'  Error: {e}')
else:
    print('ODDS_API_KEY appears to be a placeholder, skipping API check')