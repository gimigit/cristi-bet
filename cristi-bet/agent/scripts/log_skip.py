#!/usr/bin/env python3
import os
import requests
from datetime import datetime

SUPABASE_URL = "https://qdqgvlmluodubremwuzr.supabase.co"

# Read service key from .env
with open("/Users/tizo/Projects/Bet/cristi-bet/agent/.env") as f:
    for line in f:
        if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
            SERVICE_KEY = line.split("=", 1)[1].strip()
            break

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

payload = {
    "scanned_at": datetime.utcnow().isoformat(),
    "leagues_scanned": 54,
    "result": "SKIPPED",
    "reason": "API_RATE_LIMIT_EXHAUSTED",
    "matches_found": 0,
    "bets_placed": 0,
    "notes": "All 54 leagues returned ERROR - API remaining: 0"
}

resp = requests.post(
    f"{SUPABASE_URL}/rest/v1/scan_log",
    headers=headers,
    json=payload
)

print(f"Status: {resp.status_code}")
print(f"Response: {resp.text[:500]}")
