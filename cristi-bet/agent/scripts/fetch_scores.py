#!/usr/bin/env python3
import httpx, os, json
ODDS_API_KEY = os.environ.get('ODDS_API_KEY')
if ODDS_API_KEY:
    with httpx.Client() as c:
        r = c.get('https://api.the-odds-api.com/v4/sports/soccer_epl/scores/', params={'apiKey': ODDS_API_KEY, 'daysFrom': 3}, timeout=15)
        print(r.status_code)
        print(json.dumps(r.json(), indent=2))
else:
    print('No API key')