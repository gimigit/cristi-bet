#!/usr/bin/env python3
import os
import sys
BASE = '/Users/tizo/Projects/Bet/cristi-bet'
sys.path.insert(0, BASE)

from dotenv import load_dotenv
load_dotenv(os.path.join(BASE, '.env'))

print('URL:', os.environ.get('NEXT_PUBLIC_SUPABASE_URL'))
print('KEY:', 'set' if os.environ.get('SUPABASE_SERVICE_ROLE_KEY') else 'missing')

from supabase import create_client
db = create_client(os.environ['NEXT_PUBLIC_SUPABASE_URL'], os.environ['SUPABASE_SERVICE_ROLE_KEY'])

bet = db.table('bets').select('*').eq('id', 'CBT-002').execute()
print('\nBet CBT-002:')
if bet.data:
    b = bet.data[0]
    print(f'  ID: {b["id"]}')
    print(f'  Sport: {b["sport"]}')
    print(f'  Event: {b["event"]}')
    print(f'  Selection: {b["selection"]}')
    print(f'  Stake: {b["stake"]}')
    print(f'  Odds: {b["odds"]}')
    print(f'  Event date: {b["event_date"]}')
    print(f'  Status: {b["status"]}')
    if b.get('pnl'):
        print(f'  P&L: {b["pnl"]}')
    if b.get('settled_at'):
        print(f'  Settled at: {b["settled_at"]}')
else:
    print('  Not found')

hist = db.table('bankroll_history').select('*').order('recorded_at', desc=True).limit(10).execute()
print('\nBankroll history (latest):')
for h in hist.data:
    print(f'  {h["recorded_at"]}: EUR {h["balance"]:.2f}')
