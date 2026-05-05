#!/usr/bin/env python3
import os, httpx
from supabase import create_client
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

ODDS_API_KEY = os.environ.get('ODDS_API_KEY')
SUPABASE_URL  = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY  = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

db = create_client(SUPABASE_URL, SUPABASE_KEY)

# Check open bets
open_bets = db.table('bets').select('*').eq('status', 'OPEN').execute()
print(f'Open bets: {len(open_bets.data)}')
for b in open_bets.data:
    ed = b['event_date']
    event_dt = datetime.fromisoformat(ed.replace('Z', '+00:00')) if 'T' in ed else datetime.fromisoformat(ed)
    now = datetime.now(timezone.utc)
    skip_reason = ''
    if event_dt + timedelta(hours=3) > now:
        skip_reason = ' (too recent)'
    print(f'  - {b["id"]}: {b["sport"]} | {b["event"]} | odds={b["odds"]} stake={b["stake"]} | event={ed}{skip_reason}')

# Check bankroll
last = db.table('bankroll_history').select('balance').order('recorded_at', desc=True).limit(1).execute()
print(f'Current bankroll: {last.data[0]["balance"] if last.data else "N/A"} EUR')
