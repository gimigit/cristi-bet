#!/usr/bin/env python3
import os
import json
from datetime import datetime, timezone
from supabase import create_client

def main():
    # Read env vars from .env file
    env_vars = {}
    with open('.env', 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env_vars[k.strip()] = v.strip()

    url = env_vars.get('NEXT_PUBLIC_SUPABASE_URL')
    key = env_vars.get('SUPABASE_SERVICE_ROLE_KEY')

    client = create_client(url, key)
    now = datetime.now(timezone.utc).isoformat()

    record = {
        'id': f'SCAN-{datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")}',
        'event': 'ODDS_SCAN - API quota exhausted',
        'selection': 'No bet - all leagues unavailable',
        'sport': 'system',
        'league': 'scan',
        'market': 'scan',
        'event_date': now,
        'odds': 1.0,
        'confidence': 50,
        'stake': 0.0,
        'status': 'OPEN',
        'pnl': 0.0,
        'rationale': 'Odds API returned 0 available games - quota exhausted / API unavailable',
        'placed_at': now,
        'settled_at': now
    }

    try:
        result = client.table('bets').insert(record).execute()
        print(json.dumps(result.data, indent=2))
        print('Successfully inserted into Supabase.')
    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    main()
