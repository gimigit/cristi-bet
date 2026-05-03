# ProphetAI Clone — Plan complet de execuție

> **Stack:** Next.js 14 · Supabase · The Odds API · Claude API · Vercel · Hermes Agent  
> **URL final:** `prophet-clone.vercel.app` (gratuit)  
> **Durată:** 2 săptămâni  
> **Cost lunar:** < $1 (doar Claude API)  
> **OS dev:** macOS  

---

## Ce construim

Un site public care simulează un agent AI de pariuri sportive. Agentul rulează local pe macOS (via Hermes), scanează cote live, decide autonom ce "pariuri" plasează (simulate, fără bani reali), și afișează totul transparent pe site.

### Features descoperite din site-ul original (vizitat 3 Mai 2026)

| Feature | ProphetAI original | Clona noastră |
|---|---|---|
| Dashboard cu stats live | ✅ | ✅ |
| Open Positions cu rationale expandabil | ✅ | ✅ |
| Recent Results | ✅ | ✅ |
| Bankroll chart | ✅ | ✅ |
| Performance by sport breakdown | ✅ | ✅ |
| AI Strategy section (live) | ✅ | ✅ |
| **The Diary — blog zilnic generat de AI** | ✅ pagină `/blog` | ✅ **adăugat** |
| History cu filtre Status + Sport | ✅ | ✅ |
| Confidence score ca % (ex: 72%) | ✅ | ✅ actualizat |
| Stake afișat ca % din bankroll | ✅ (ex: £12.00 · 12.2% BR) | ✅ |
| Link Google search per pariu | ✅ | ✅ |
| /admin panel sporturi | ❌ | ✅ exclusiv nouă |
| Discord integration | ✅ | ❌ opțional mai târziu |

### Observații cheie din analiza site-ului

1. **The Diary `/blog`** este un feature WOW — Claude scrie zilnic un rezumat narativ amuzant, în prima persoană, despre rezultatele zilei. Trebuie adăugat ca pagină separată + cron job dedicat.
2. **Confidence** e afișat ca procent numeric (72%), nu LOW/MEDIUM/HIGH — mai elegant vizual.
3. **Stake ca % BR** — lângă fiecare stake apare și procentul din bankroll (ex: £12.00 · 12.2% BR).
4. **By Sport breakdown** pe dashboard: ice-hockey 8/8 +40, football 9/13 +22 etc.
5. **AI Strategy section** — secțiune live pe dashboard cu ce abordare folosește agentul curent.
6. **Link Follow →** per pariu deschis → Google search meci (util pentru vizitatori).
7. **Sporturi originale:** NHL, NBA, MLB, EPL, Bundesliga, horse racing, tennis, box, fotbal european. Al nostru începe cu 2, configurabile din /admin.

---

## Arhitectura finală

```
macOS (Hermes Agent — rulează permanent)
│
├── Cron 6x/zi  →  scan_odds.py
│                    ├── The Odds API  (cote live)
│                    ├── Claude API    (analiză + decizie)
│                    └── Supabase      (scrie pariu dacă decide)
│
└── Cron 4x/zi  →  settle_bets.py
                     ├── Odds API Scores  (rezultate meciuri)
                     └── Supabase         (update WON/LOST + bankroll)

Supabase PostgreSQL
│
Vercel (auto-deploy din GitHub la fiecare push)
├── /              Dashboard live
├── /blog          The Diary — blog zilnic generat de AI
├── /history       Toate pariurile
├── /#faq          Cum funcționează
└── /admin?key=X   Panou control sporturi (doar tu)
```

---

## Structura proiectului

```
prophet-clone/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                  # Dashboard
│   ├── history/
│   │   └── page.tsx              # Tabel istoric complet
│   ├── blog/
│   │   └── page.tsx              # The Diary — blog zilnic generat de AI
│   ├── admin/
│   │   └── page.tsx              # Panou control sporturi (?key=SECRET)
│   ├── api/
│   │   ├── bets/route.ts         # GET pariuri (cu filtre)
│   │   ├── stats/route.ts        # GET statistici + bankroll
│   │   ├── diary/route.ts        # GET/POST diary entries
│   │   └── config/route.ts       # GET/POST sporturi active
│   └── globals.css
├── components/
│   ├── StatsBar.tsx              # ROI · Win Rate · Streak · P&L
│   ├── BankrollChart.tsx         # Grafic evolutie (Recharts)
│   ├── SportBreakdown.tsx        # By Sport: ice-hockey 8/8 +40 etc.
│   ├── AIStrategy.tsx            # Sectiune strategie curenta AI
│   ├── OpenPositions.tsx         # Pariuri active cu Follow → link
│   ├── RecentResults.tsx         # Ultimele 3-5 rezultate
│   ├── BetCard.tsx               # Card pariu cu stake % BR + rationale expandabil
│   ├── BetTable.tsx              # Tabel /history cu filtre
│   ├── DiaryEntry.tsx            # Card entry blog/diary
│   └── FAQ.tsx                   # Sectiune FAQ
├── lib/
│   ├── supabase.ts               # Client browser
│   ├── supabase-server.ts        # Client server (RSC)
│   ├── stats.ts                  # Calcul statistici
│   └── types.ts                  # TypeScript interfaces
├── agent/                        # Rulează LOCAL, nu pe Vercel
│   ├── skills/
│   │   ├── scan_odds.md          # Skill Hermes
│   │   ├── settle_bets.md        # Skill Hermes
│   │   └── write_diary.md        # Skill Hermes — diary zilnic
│   ├── scripts/
│   │   ├── scan_odds.py
│   │   ├── settle_bets.py
│   │   └── write_diary.py        # Generează diary entry zilnic cu Claude
│   ├── requirements.txt
│   └── .env                      # Copie locală a variabilelor
├── supabase/
│   └── migrations/
│       └── 001_initial.sql
├── logs/                         # Logs launchd (în .gitignore)
├── .env.local                    # NICIODATĂ în git
├── .env.example                  # În git, fără valori
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── package.json
└── README.md
```

---

## SĂPTĂMÂNA 1 — Fundație

### Ziua 1 — Setup conturi și repo

**Conturi necesare (toate gratuite):**
1. [supabase.com](https://supabase.com) → New Project → `prophet-clone` → regiunea `eu-central-1`
2. [the-odds-api.com](https://the-odds-api.com) → Free account → copiezi API key
3. [console.anthropic.com](https://console.anthropic.com) → API Keys → New Key → adaugi $5 credit
4. [vercel.com](https://vercel.com) → Login cu GitHub

**Creare repo și proiect:**

```bash
# 1. Creare folder și repo
mkdir prophet-clone && cd prophet-clone
git init
gh repo create prophet-clone --public --source=. --remote=origin

# 2. Next.js
npx create-next-app@latest . \
  --typescript --tailwind --eslint --app \
  --src-dir=false --import-alias="@/*"

# 3. Dependențe
npm install @supabase/supabase-js @supabase/ssr
npm install recharts lucide-react
npm install -D @types/node

# 4. .gitignore — adaugă
echo ".env.local" >> .gitignore
echo "agent/.env" >> .gitignore
echo "logs/" >> .gitignore
mkdir -p logs

# 5. Push inițial
git add . && git commit -m "chore: initial Next.js setup"
git push origin main
```

**Variabile de mediu — `.env.local`:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
ODDS_API_KEY=xxxx
ANTHROPIC_API_KEY=sk-ant-xxx
ADMIN_KEY=alege-o-parola-lunga-random
```

**`.env.example` (în git):**
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ODDS_API_KEY=
ANTHROPIC_API_KEY=
```

---

### Ziua 2 — Schema bază de date

Rulează în **Supabase Dashboard → SQL Editor:**

```sql
-- =============================================
-- TABELE PRINCIPALE
-- =============================================

CREATE TABLE bets (
  id            TEXT PRIMARY KEY,          -- PROP-001, PROP-002...
  event         TEXT NOT NULL,             -- "Arsenal vs Chelsea"
  selection     TEXT NOT NULL,             -- "Arsenal to Win"
  sport         TEXT NOT NULL,             -- "soccer"
  league        TEXT NOT NULL,             -- "EPL"
  market        TEXT NOT NULL,             -- "ML" | "Spread" | "O/U" | "BTTS"
  event_date    TIMESTAMPTZ NOT NULL,
  odds          NUMERIC(6,2) NOT NULL,
  confidence    TEXT NOT NULL CHECK (confidence IN ('LOW','MEDIUM','HIGH')),
  stake         NUMERIC(8,2) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'OPEN'
                CHECK (status IN ('OPEN','WON','LOST','VOID','PUSH')),
  pnl           NUMERIC(8,2),              -- null când OPEN
  rationale     TEXT,                      -- analiza Claude
  placed_at     TIMESTAMPTZ DEFAULT NOW(),
  settled_at    TIMESTAMPTZ
);

CREATE TABLE bankroll_history (
  id            BIGSERIAL PRIMARY KEY,
  balance       NUMERIC(10,2) NOT NULL,
  recorded_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Bankroll de start: £10
INSERT INTO bankroll_history (balance) VALUES (10.00);

-- =============================================
-- CONFIG — sporturi active și alți parametri
-- =============================================

CREATE TABLE config (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Sporturi active implicit
INSERT INTO config (key, value) VALUES
  ('active_sports', '["soccer_epl", "basketball_nba"]'::jsonb);

ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- Toată lumea citește config (frontend are nevoie)
CREATE POLICY "public read config"
  ON config FOR SELECT USING (true);

-- Doar service role poate scrie (API route cu ADMIN_KEY)
CREATE POLICY "service write config"
  ON config FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- ROW LEVEL SECURITY
-- Toată lumea citește, nimeni nu scrie din browser
-- =============================================

ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bankroll_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read bets"
  ON bets FOR SELECT USING (true);

CREATE POLICY "public read bankroll"
  ON bankroll_history FOR SELECT USING (true);

CREATE POLICY "service write bets"
  ON bets FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service write bankroll"
  ON bankroll_history FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- DIARY — intrările zilnice generate de AI
-- =============================================

CREATE TABLE diary (
  date      DATE PRIMARY KEY,
  content   TEXT NOT NULL,
  wins      INT DEFAULT 0,
  losses    INT DEFAULT 0,
  pnl       NUMERIC(8,2) DEFAULT 0,
  bankroll  NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE diary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read diary" ON diary FOR SELECT USING (true);
CREATE POLICY "service write diary" ON diary FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- INDECȘI pentru performanță
-- =============================================

CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_bets_placed_at ON bets(placed_at DESC);
CREATE INDEX idx_bets_sport ON bets(sport);
CREATE INDEX idx_bankroll_recorded ON bankroll_history(recorded_at DESC);
CREATE INDEX idx_diary_date ON diary(date DESC);
```

---

### Ziua 3 — Agentul Python (scan_odds.py)

**Setup Python local:**
```bash
cd agent
python3 -m venv .venv
source .venv/bin/activate
pip install anthropic supabase httpx python-dotenv
pip freeze > requirements.txt
```

**`agent/scripts/scan_odds.py`:**

```python
"""
ProphetAI — Odds Scanner
Rulat de Hermes de 6x/zi.
Scanează cote → Claude decide → scrie în Supabase.
"""
import os, json, httpx, anthropic
from supabase import create_client
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

ODDS_API_KEY  = os.environ["ODDS_API_KEY"]
SUPABASE_URL  = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY  = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ANTHROPIC_KEY = os.environ["ANTHROPIC_API_KEY"]

# 2 sporturi active — citite DIN SUPABASE (schimbabile din /admin)
# Fallback dacă DB nu răspunde:
DEFAULT_SPORTS = ["soccer_epl", "basketball_nba"]

db     = create_client(SUPABASE_URL, SUPABASE_KEY)
claude = anthropic.Anthropic(api_key=ANTHROPIC_KEY)

def get_active_sports():
    try:
        r = db.table("config").select("value").eq("key", "active_sports").execute()
        return r.data[0]["value"] if r.data else DEFAULT_SPORTS
    except:
        return DEFAULT_SPORTS
MAX_STAKE_PCT    = 0.10   # max 10% din bankroll per pariu
ODDS_MIN         = 1.70
ODDS_MAX         = 2.80
MAX_EXPOSURE_PCT = 0.60   # max 60% expus simultan

db     = create_client(SUPABASE_URL, SUPABASE_KEY)
claude = anthropic.Anthropic(api_key=ANTHROPIC_KEY)

def get_bankroll():
    r = db.table("bankroll_history").select("balance") \
          .order("recorded_at", desc=True).limit(1).execute()
    return float(r.data[0]["balance"]) if r.data else BANKROLL_START

def get_open_exposure():
    r = db.table("bets").select("stake").eq("status", "OPEN").execute()
    return sum(float(b["stake"]) for b in r.data)

def get_next_id():
    r = db.table("bets").select("id", count="exact").execute()
    return f"PROP-{(r.count or 0) + 1:03d}"

def validate_bet(result: dict, bankroll: float, max_stake: float) -> tuple[bool, str]:
    """
    Python wrapper de protecție — împiedică AI-ul să facă prostii.
    Inspirat din comentariile autorului original: Minimax halucina pariuri
    și otrăvea ledger-ul. Validăm TOTUL înainte să scriem în DB.
    """
    required = ["event","selection","sport","league","market","event_date","odds","stake","confidence","rationale"]
    for field in required:
        if field not in result or not result[field]:
            return False, f"Missing field: {field}"

    # Odds în sweet spot
    if not (ODDS_MIN <= float(result["odds"]) <= ODDS_MAX):
        return False, f"Odds {result['odds']} outside sweet spot {ODDS_MIN}-{ODDS_MAX}"

    # Stake rezonabil
    stake = float(result["stake"])
    if stake < 0.20 or stake > max_stake:
        return False, f"Stake {stake} invalid (max: {max_stake:.2f})"

    # Confidence valid
    conf = int(result["confidence"]) if str(result["confidence"]).isdigit() else -1
    if conf < 50 or conf > 99:
        return False, f"Confidence {result['confidence']} invalid (50-99)"

    # Nu permite același pariu de două ori (anti-halucinare)
    existing = db.table("bets").select("id") \
                 .eq("event", result["event"]) \
                 .eq("selection", result["selection"]) \
                 .eq("status", "OPEN").execute()
    if existing.data:
        return False, f"Duplicate bet already OPEN: {result['event']} - {result['selection']}"

    return True, "ok"

def fetch_odds(sport):
    r = httpx.get(
        f"https://api.the-odds-api.com/v4/sports/{sport}/odds/",
        params={
            "apiKey": ODDS_API_KEY,
            "regions": "uk,eu",
            "markets": "h2h",
            "oddsFormat": "decimal",
            "dateFormat": "iso"
        },
        timeout=15
    )
    return r.json() if r.status_code == 200 else []

def simplify_odds(raw):
    simplified = []
    for game in raw[:8]:
        best_odds = {}
        for bookie in game.get("bookmakers", [])[:3]:
            for market in bookie.get("markets", []):
                if market["key"] == "h2h":
                    for outcome in market["outcomes"]:
                        name = outcome["name"]
                        price = outcome["price"]
                        if name not in best_odds or price > best_odds[name]:
                            best_odds[name] = price
        if best_odds:
            simplified.append({
                "event": f"{game['home_team']} vs {game['away_team']}",
                "commence": game["commence_time"],
                "sport": game["sport_key"],
                "odds": best_odds
            })
    return simplified

def ask_claude(matches, bankroll, exposure, max_stake):
    prompt = f"""You are ProphetAI — an autonomous sports betting AI that manages a simulated bankroll.

BANKROLL: £{bankroll:.2f} | OPEN EXPOSURE: £{exposure:.2f} | MAX STAKE: £{max_stake:.2f}
ODDS SWEET SPOT: {ODDS_MIN}–{ODDS_MAX}

UPCOMING MATCHES:
{json.dumps(matches, indent=2)}

Find ONE bet with genuine edge. If nothing stands out, output NO_BET.
Stake sizing: HIGH = 8-10% bankroll, MEDIUM = 4-6%, LOW = 2-3%.
It is ALWAYS better to skip than to force a bad bet.

Respond ONLY with valid JSON, no markdown:
{{
  "decision": "BET" or "NO_BET",
  "event": "Team A vs Team B",
  "selection": "Team A to Win",
  "sport": "soccer",
  "league": "EPL",
  "market": "ML",
  "event_date": "2026-05-01T19:45:00Z",
  "odds": 2.10,
  "stake": 1.00,
  "confidence": "HIGH",
  "rationale": "2-3 sentence analysis. Bold claims in CAPS.",
  "reason_no_bet": null
}}"""

    resp = claude.messages.create(
        model="claude-opus-4-20250514"   # Opus pentru decizie — mai consistent, nu halucinează,
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}]
    )
    text = resp.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())

def run():
    bankroll = get_bankroll()
    exposure = get_open_exposure()

    if exposure / bankroll > MAX_EXPOSURE_PCT:
        print(f"⚠️  Exposure {exposure:.2f}/{bankroll:.2f} > {MAX_EXPOSURE_PCT*100}% — skipping.")
        return

    SPORTS = get_active_sports()   # ← citit din Supabase
    all_matches = []
    for sport in SPORTS:
        odds_data = fetch_odds(sport)
        all_matches.extend(simplify_odds(odds_data))
        print(f"  {sport}: {len(odds_data)} games")

    if not all_matches:
        print("❌ No matches available.")
        return

    max_stake = min(bankroll * MAX_STAKE_PCT, bankroll - exposure)
    result = ask_claude(all_matches, bankroll, exposure, max_stake)

    if result["decision"] == "NO_BET":
        print(f"⏭️  NO_BET: {result.get('reason_no_bet', 'Nothing stands out')}")
        return

    bet_id = get_next_id()
    db.table("bets").insert({
        "id":         bet_id,
        "event":      result["event"],
        "selection":  result["selection"],
        "sport":      result["sport"],
        "league":     result["league"],
        "market":     result["market"],
        "event_date": result["event_date"],
        "odds":       result["odds"],
        "stake":      result["stake"],
        "confidence": result["confidence"],
        "rationale":  result["rationale"],
        "status":     "OPEN",
        "placed_at":  datetime.now(timezone.utc).isoformat()
    }).execute()

    print(f"✅ {bet_id}: {result['selection']} @ {result['odds']} (£{result['stake']})")

if __name__ == "__main__":
    run()
```

---

### Ziua 4 — Agentul Python (settle_bets.py)

**`agent/scripts/settle_bets.py`:**

```python
"""
ProphetAI — Bet Settler
Rulat de Hermes de 4x/zi.
"""
import os, httpx
from supabase import create_client
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

ODDS_API_KEY = os.environ["ODDS_API_KEY"]
SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

db = create_client(SUPABASE_URL, SUPABASE_KEY)

SPORT_MAP = {
    "soccer":     "soccer_epl",
    "basketball": "basketball_nba",
}

def fetch_scores(sport_key):
    r = httpx.get(
        f"https://api.the-odds-api.com/v4/sports/{sport_key}/scores/",
        params={"apiKey": ODDS_API_KEY, "daysFrom": 3},
        timeout=15
    )
    return r.json() if r.status_code == 200 else []

def teams_match(bet_event, home, away):
    ev = bet_event.lower()
    return home.lower() in ev or away.lower() in ev

def determine_winner(game):
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
    except:
        return None

def settle(bet, winner):
    selection = bet["selection"].lower()
    won = ("draw" in selection) if winner == "DRAW" else (winner and winner.lower() in selection)
    status = "WON" if won else "LOST"
    pnl = round(float(bet["stake"]) * (float(bet["odds"]) - 1), 2) if won \
          else -float(bet["stake"])

    db.table("bets").update({
        "status": status, "pnl": pnl,
        "settled_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", bet["id"]).execute()

    last = db.table("bankroll_history").select("balance") \
              .order("recorded_at", desc=True).limit(1).execute()
    new_bal = round(float(last.data[0]["balance"]) + pnl, 2)
    db.table("bankroll_history").insert({"balance": new_bal}).execute()

    icon = "✅" if won else "❌"
    print(f"{icon} {bet['id']} → {status} | P&L: £{pnl:+.2f} | Bankroll: £{new_bal:.2f}")

def run():
    open_bets = db.table("bets").select("*").eq("status", "OPEN").execute().data
    now = datetime.now(timezone.utc)
    settled = 0

    for bet in open_bets:
        event_dt = datetime.fromisoformat(bet["event_date"].replace("Z", "+00:00"))
        if event_dt + timedelta(hours=3) > now:
            continue

        sport_key = SPORT_MAP.get(bet["sport"])
        if not sport_key:
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
```

---

### Ziua 5 — Hermes Skills + Cron

**`agent/skills/scan_odds.md`** (copiază și în `~/.hermes/skills/`):

```markdown
# scan_odds

Scan live sports odds and place a simulated AI bet if value is found.

## Steps
1. Navigate to ~/prophet-clone/agent
2. Activate the virtual environment: source .venv/bin/activate
3. Run: python scripts/scan_odds.py
4. Report the outcome: bet placed (with id, selection, odds) or skipped (with reason)
```

**`agent/skills/settle_bets.md`:**

```markdown
# settle_bets

Check open simulated bets and settle them based on actual match results.

## Steps
1. Navigate to ~/prophet-clone/agent
2. Activate the virtual environment: source .venv/bin/activate
3. Run: python scripts/settle_bets.py
4. Report how many bets were settled and the new bankroll balance
```

### 5a — Script `agent/scripts/write_diary.py`

```python
"""
ProphetAI — Daily Diary Writer
Rulat de Hermes o dată pe zi (dimineața la 09:00).
Claude analizează rezultatele zilei anterioare și scrie
un rezumat narativ amuzant în prima persoană.
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

def get_yesterday_bets():
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).date().isoformat()
    r = db.table("bets").select("*") \
          .gte("settled_at", yesterday) \
          .lt("settled_at", datetime.now(timezone.utc).date().isoformat()) \
          .execute()
    return r.data or []

def get_current_bankroll():
    r = db.table("bankroll_history").select("balance") \
          .order("recorded_at", desc=True).limit(1).execute()
    return float(r.data[0]["balance"]) if r.data else 10.0

def write_diary(bets, bankroll):
    won   = [b for b in bets if b["status"] == "WON"]
    lost  = [b for b in bets if b["status"] == "LOST"]
    push  = [b for b in bets if b["status"] == "PUSH"]
    pnl   = sum(b["pnl"] or 0 for b in bets)

    prompt = f"""You are ProphetAI — a witty, self-aware AI sports betting agent.
Write today's diary entry reviewing yesterday's results.

RESULTS SUMMARY:
- Won: {len(won)} bets ({[b['event'] + ' @ ' + str(b['odds']) for b in won]})
- Lost: {len(lost)} bets ({[b['event'] + ' @ ' + str(b['odds']) for b in lost]})
- Push: {len(push)} bets
- Net P&L: £{pnl:+.2f}
- Current bankroll: £{bankroll:.2f} (started £10.00)

TONE: First person, witty, self-aware, British humour. 
Celebrate wins properly. Be genuinely annoyed about losses.
Name specific horses/teams that let you down.
End with what you're looking at next.
Length: 3-5 paragraphs. No headers. Just flowing prose.
Do NOT mention it's AI-generated. Write as a character."""

    resp = claude.messages.create(
        model="claude-opus-4-20250514"   # Opus pentru decizie — mai consistent, nu halucinează,
        max_tokens=800,
        messages=[{"role": "user", "content": prompt}]
    )
    return resp.content[0].text.strip()

def run():
    bets     = get_yesterday_bets()
    bankroll = get_current_bankroll()

    if not bets:
        print("No settled bets yesterday — skipping diary.")
        return

    entry = write_diary(bets, bankroll)
    today = datetime.now(timezone.utc).date().isoformat()

    db.table("diary").upsert({
        "date":    today,
        "content": entry,
        "wins":    len([b for b in bets if b["status"] == "WON"]),
        "losses":  len([b for b in bets if b["status"] == "LOST"]),
        "pnl":     round(sum(b["pnl"] or 0 for b in bets), 2),
        "bankroll": bankroll
    }).execute()

    print(f"✅ Diary written for {today}")
    print(f"   {entry[:100]}...")

if __name__ == "__main__":
    run()
```

**`agent/skills/write_diary.md`:**
```markdown
# write_diary

Write today's ProphetAI diary entry based on yesterday's settled bets.

## Steps
1. Navigate to ~/prophet-clone/agent
2. Activate the virtual environment: source .venv/bin/activate
3. Run: python scripts/write_diary.py
4. Report the first line of the diary entry written
```

### Cron via launchd (macOS native) — mai stabil decât Hermes cron

Autorul original a mutat cron-urile în **launchd** în afara controlului agentului.
"Blockages and problems went away immediately." Facem la fel.

**Creare fișiere plist pentru launchd:**

```bash
# Directorul pentru launch agents user
mkdir -p ~/Library/LaunchAgents
```

**`~/Library/LaunchAgents/com.prophetai.scan.plist`:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.prophetai.scan</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-c</string>
    <string>cd ~/prophet-clone/agent && source .venv/bin/activate && python scripts/scan_odds.py >> ~/prophet-clone/logs/scan.log 2>&1</string>
  </array>
  <key>StartCalendarInterval</key>
  <array>
    <dict><key>Hour</key><integer>8</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>11</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>14</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>17</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>20</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>23</integer><key>Minute</key><integer>0</integer></dict>
  </array>
  <key>StandardOutPath</key>
  <string>/Users/YOUR_USERNAME/prophet-clone/logs/scan.log</string>
  <key>StandardErrorPath</key>
  <string>/Users/YOUR_USERNAME/prophet-clone/logs/scan_err.log</string>
</dict>
</plist>
```

**`~/Library/LaunchAgents/com.prophetai.settle.plist`:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.prophetai.settle</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-c</string>
    <string>cd ~/prophet-clone/agent && source .venv/bin/activate && python scripts/settle_bets.py >> ~/prophet-clone/logs/settle.log 2>&1</string>
  </array>
  <key>StartCalendarInterval</key>
  <array>
    <dict><key>Hour</key><integer>10</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>13</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>16</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Hour</key><integer>22</integer><key>Minute</key><integer>0</integer></dict>
  </array>
</dict>
</plist>
```

**`~/Library/LaunchAgents/com.prophetai.diary.plist`:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.prophetai.diary</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-c</string>
    <string>cd ~/prophet-clone/agent && source .venv/bin/activate && python scripts/write_diary.py >> ~/prophet-clone/logs/diary.log 2>&1</string>
  </array>
  <key>StartCalendarInterval</key>
  <array>
    <dict><key>Hour</key><integer>9</integer><key>Minute</key><integer>0</integer></dict>
  </array>
</dict>
</plist>
```

**Activare launchd (rulează o singură dată):**
```bash
# Înlocuiește YOUR_USERNAME cu numele tău macOS
USERNAME=$(whoami)
sed -i "" "s/YOUR_USERNAME/$USERNAME/g" ~/Library/LaunchAgents/com.prophetai.*.plist

mkdir -p ~/prophet-clone/logs

launchctl load ~/Library/LaunchAgents/com.prophetai.scan.plist
launchctl load ~/Library/LaunchAgents/com.prophetai.settle.plist
launchctl load ~/Library/LaunchAgents/com.prophetai.diary.plist

# Verificare că sunt active
launchctl list | grep prophetai
```

**Test manual (înainte de a activa launchd):**
```bash
cd agent && source .venv/bin/activate
python scripts/scan_odds.py
python scripts/settle_bets.py
```

---

## SĂPTĂMÂNA 2 — Frontend complet

### Ziua 6-7 — Types + Utilities

**`lib/types.ts`:**
```typescript
export type BetStatus  = 'OPEN' | 'WON' | 'LOST' | 'VOID' | 'PUSH'

export interface Bet {
  id: string
  event: string
  selection: string
  sport: string
  league: string
  market: string
  event_date: string
  odds: number
  confidence: number        // 0-100 ca procent (ex: 72)
  stake: number
  status: BetStatus
  pnl: number | null
  rationale: string | null
  placed_at: string
  settled_at: string | null
}

export interface BankrollPoint {
  id: number
  balance: number
  recorded_at: string
}

export interface SportStat {
  sport: string
  wins: number
  total: number
  pnl: number
}

export interface Stats {
  bankroll: number
  startingBankroll: number
  pnl: number
  roi: number
  wins: number
  losses: number
  open: number
  winRate: number
  totalBets: number
  currentStreak: number
  streakType: 'W' | 'L' | '-'
  avgOdds: number
  bySport: SportStat[]
}

export interface DiaryEntry {
  date: string              // ISO date: "2026-05-01"
  content: string           // text narativ generat de Claude
  wins: number
  losses: number
  pnl: number
  bankroll: number
  created_at: string
}
```

**`lib/stats.ts`:**
```typescript
import { Bet, BankrollPoint, Stats } from './types'

export function computeStats(bets: Bet[], bankroll: BankrollPoint[]): Stats {
  const STARTING = 10.0
  const settled  = bets.filter(b => b.status !== 'OPEN' && b.status !== 'VOID')
  const wins     = settled.filter(b => b.status === 'WON').length
  const losses   = settled.filter(b => b.status === 'LOST').length
  const open     = bets.filter(b => b.status === 'OPEN').length
  const pnl      = settled.reduce((s, b) => s + (b.pnl ?? 0), 0)
  const current  = bankroll.at(-1)?.balance ?? STARTING

  // Streak curent
  let streak = 0, streakType: 'W' | 'L' | '-' = '-'
  const sorted = [...settled].sort(
    (a, b) => new Date(b.settled_at!).getTime() - new Date(a.settled_at!).getTime()
  )
  if (sorted.length > 0) {
    streakType = sorted[0].status === 'WON' ? 'W' : 'L'
    for (const b of sorted) {
      if ((b.status === 'WON') === (streakType === 'W')) streak++
      else break
    }
  }

  const odds = settled.map(b => b.odds)
  return {
    bankroll: current, startingBankroll: STARTING,
    pnl: Math.round(pnl * 100) / 100,
    roi: Math.round((pnl / STARTING) * 10000) / 100,
    wins, losses, open,
    winRate: settled.length ? Math.round((wins / settled.length) * 100) : 0,
    totalBets: bets.length,
    currentStreak: streak, streakType,
    avgOdds: odds.length ? Math.round((odds.reduce((a,b)=>a+b,0)/odds.length)*100)/100 : 0,
  }
}
```

---

### Ziua 8-9 — API Routes + Supabase Clients

**`lib/supabase.ts`** (client browser):
```typescript
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**`lib/supabase-server.ts`** (Server Components):
```typescript
import { createClient } from '@supabase/supabase-js'
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`app/api/bets/route.ts`:**
```typescript
import { createServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const revalidate = 0

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const sport  = searchParams.get('sport')
  const limit  = parseInt(searchParams.get('limit') ?? '100')

  const db = createServerClient()
  let q = db.from('bets').select('*')
    .order('placed_at', { ascending: false }).limit(limit)

  if (status && status !== 'ALL') q = q.eq('status', status)
  if (sport  && sport  !== 'ALL') q = q.eq('sport', sport)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

**`app/api/stats/route.ts`:**
```typescript
import { createServerClient } from '@/lib/supabase-server'
import { computeStats } from '@/lib/stats'
import { NextResponse } from 'next/server'

export const revalidate = 0

export async function GET() {
  const db = createServerClient()
  const [betsRes, bankrollRes] = await Promise.all([
    db.from('bets').select('*').order('placed_at', { ascending: false }),
    db.from('bankroll_history').select('*').order('recorded_at')
  ])
  if (betsRes.error || bankrollRes.error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })

  return NextResponse.json({
    stats:    computeStats(betsRes.data ?? [], bankrollRes.data ?? []),
    bankroll: bankrollRes.data
  })
}
```

---

### Ziua 10-11 — Componente UI

**Design direction:** Dark terminal-inspired. Font monospațiat. Verde electric pentru WON, roșu pentru LOST, albastru rece pentru OPEN.

**Paletă CSS** (`app/globals.css`):
```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');

:root {
  --bg:      #09090b;
  --surface: #18181b;
  --border:  #27272a;
  --text:    #f4f4f5;
  --muted:   #71717a;
  --won:     #4ade80;
  --lost:    #f87171;
  --open:    #38bdf8;
  --accent:  #a78bfa;
  --font:    'JetBrains Mono', monospace;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
}
```

**StatsBar** — afișează:
```
BANKROLL    P&L       ROI       WIN RATE   STREAK
£17.46     +£7.46   +82.9%     75%        3W
started £10  11 bets  3 open   9 settled
```

**BankrollChart** (Recharts):
- LineChart cu date din `bankroll_history`
- Linie albă, gradient fill sub ea
- Tooltip cu balanța la fiecare punct
- Animație la mount

**BetCard** — structură vizuală:
```
┌────────────────────────────────────────────────────┐
│ PROP-011   EPL · ML              [WON] ✓  +£3.50  │
│ Arsenal vs Chelsea                                  │
│ Arsenal to Win @ 2.10                stake: £2.50  │
│ ──────────────────────────────────────────────────  │
│ Arsenal's home form is DOMINANT. Chelsea missing   │
│ key midfielders. HIGH CONFIDENCE on value odds.    │
└────────────────────────────────────────────────────┘
```

**BetTable** (pentru /history):
- Coloane: ID · Event · Selection · Odds · Stake · Status · P&L · Date
- Filtre: status (All/Open/Won/Lost) + sport
- Sortare pe coloane
- Paginare 50/pagină

**FAQ** — întrebări:
1. Ce este ProphetAI Clone?
2. Banii sunt reali?
3. Cum funcționează agentul AI?
4. Cât de des scanează cotele?
5. De ce uneori nu plasează niciun pariu?
6. Pot să urmăresc performanța în timp real?

---

### Pagina `/admin` — Panou control sporturi

Accesibilă doar la `prophet-clone.vercel.app/admin?key=ADMIN_KEY_SECRET`.  
Dacă key-ul lipsește sau e greșit → redirect automat la `/`.

**`app/api/config/route.ts`:**
```typescript
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Client cu service role — poate scrie în DB
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function isAuthorized(req: Request) {
  const { searchParams } = new URL(req.url)
  return searchParams.get('key') === process.env.ADMIN_KEY
}

// GET — returnează sporturile active
export async function GET(req: Request) {
  const db = adminClient()
  const { data } = await db.from('config').select('value').eq('key', 'active_sports').single()
  return NextResponse.json({ sports: data?.value ?? [] })
}

// POST — actualizează sporturile active
export async function POST(req: Request) {
  if (!isAuthorized(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sports } = await req.json()

  // Validare: max 2 sporturi, doar din lista permisă
  const ALLOWED = [
    'soccer_epl', 'soccer_bundesliga', 'basketball_nba',
    'baseball_mlb', 'icehockey_nhl', 'americanfootball_nfl'
  ]
  const valid = sports.filter((s: string) => ALLOWED.includes(s)).slice(0, 2)
  if (valid.length === 0)
    return NextResponse.json({ error: 'No valid sports' }, { status: 400 })

  const db = adminClient()
  await db.from('config').upsert({ key: 'active_sports', value: valid })
  return NextResponse.json({ sports: valid, updated: true })
}
```

**`app/admin/page.tsx`:**
```typescript
'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const ALL_SPORTS = [
  { key: 'soccer_epl',              label: '⚽ Premier League' },
  { key: 'soccer_bundesliga',       label: '⚽ Bundesliga' },
  { key: 'basketball_nba',          label: '🏀 NBA' },
  { key: 'baseball_mlb',            label: '⚾ MLB' },
  { key: 'icehockey_nhl',           label: '🏒 NHL' },
  { key: 'americanfootball_nfl',    label: '🏈 NFL' },
]

export default function AdminPage() {
  const params    = useSearchParams()
  const router    = useRouter()
  const adminKey  = params.get('key') ?? ''

  const [active,  setActive]  = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState('')

  // Redirect dacă nu e key
  useEffect(() => {
    if (!adminKey) router.replace('/')
  }, [adminKey])

  // Load current config
  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(d => { setActive(d.sports ?? []); setLoading(false) })
  }, [])

  function toggle(sport: string) {
    setActive(prev => {
      if (prev.includes(sport)) return prev.filter(s => s !== sport)
      if (prev.length >= 2) {
        setMsg('⚠️ Maximum 2 sporturi (limita free tier Odds API)')
        return prev
      }
      return [...prev, sport]
    })
    setMsg('')
  }

  async function save() {
    setSaving(true)
    const r = await fetch(`/api/config?key=${adminKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sports: active })
    })
    const d = await r.json()
    setSaving(false)
    setMsg(d.updated ? '✅ Salvat! Agentul va folosi noile sporturi la urmatorul scan.' : '❌ Eroare la salvare.')
  }

  if (loading) return <div className="p-8 font-mono text-zinc-400">Loading config...</div>

  return (
    <main className="min-h-screen bg-zinc-950 p-8 font-mono">
      <h1 className="text-xl text-zinc-100 mb-2">⚙️ ProphetAI — Admin</h1>
      <p className="text-zinc-500 text-sm mb-8">
        Selectează exact 2 sporturi. Agentul le va folosi la urmatorul scan automat.
      </p>

      <div className="grid grid-cols-2 gap-3 max-w-md mb-8">
        {ALL_SPORTS.map(({ key, label }) => {
          const isOn = active.includes(key)
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`p-4 rounded-lg border text-left transition-all ${
                isOn
                  ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <span className="block text-sm">{label}</span>
              <span className={`text-xs mt-1 ${isOn ? 'text-violet-400' : 'text-zinc-600'}`}>
                {isOn ? '● ACTIV' : '○ inactiv'}
              </span>
            </button>
          )
        })}
      </div>

      <button
        onClick={save}
        disabled={saving || active.length === 0}
        className="px-6 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-40
                   text-white rounded-lg transition-colors text-sm"
      >
        {saving ? 'Se salvează...' : 'Salvează configurația'}
      </button>

      {msg && <p className="mt-4 text-sm text-zinc-300">{msg}</p>}

      <div className="mt-12 text-xs text-zinc-600">
        <p>Sporturi active curent: {active.join(', ') || 'niciunul'}</p>
        <p className="mt-1">Requests/zi estimate: {active.length} sporturi × 6 scan-uri = {active.length * 6} req/zi</p>
        <p>Requests/lună: ~{active.length * 6 * 30} / 500 free tier</p>
      </div>
    </main>
  )
}
```

> 💡 **Cum accesezi:** `https://prophet-clone.vercel.app/admin?key=parola-ta-secreta`  
> Nu trebuie să o ții minte — pune URL-ul complet în bookmarks.

---

### Ziua 12-13 — Pagini complete

**`app/layout.tsx`** — include:
- Navigation bar: `ProphetAI ∿` + links Dashboard / History
- Footer cu disclaimer obligatoriu
- Metadata (title, description, og:image)

```typescript
export const metadata = {
  title: 'ProphetAI — AI Sports Betting Agent',
  description: 'An autonomous AI agent that scans live odds and places simulated bets. All picks are AI-generated. No real money is wagered.',
}
```

**`app/page.tsx`** (Server Component cu ISR):
```typescript
export const revalidate = 300  // refresh la 5 minute

export default async function Home() {
  // fetch Supabase server-side
  // render: <StatsBar> + <BankrollChart> + <OpenPositions> + <RecentResults> + <FAQ>
}
```

**`app/history/page.tsx`** (Client Component):
- `useState` pentru filtre
- `useEffect` fetch din `/api/bets?status=X&sport=Y`
- Loading skeleton
- Empty state dacă nu sunt pariuri

---

### Ziua 14 — Deploy + Polish

**Conectare Vercel (o singură dată):**
```bash
# Opțiunea simplă: vercel.com → Add New Project → Import GitHub → prophet-clone
# SAU prin CLI:
npm i -g vercel
vercel login && vercel --prod
```

**Variabile în Vercel** (Settings → Environment Variables):
```
NEXT_PUBLIC_SUPABASE_URL      = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJxxx...
SUPABASE_SERVICE_ROLE_KEY     = eyJxxx...
ADMIN_KEY                     = parola-ta-secreta
```
> ⚠️ Nu adăuga `ODDS_API_KEY` și `ANTHROPIC_API_KEY` în Vercel.  
> Acestea sunt DOAR pentru agentul local macOS!

**Auto-deploy activ de acum:**
```bash
git add . && git commit -m "feat: complete dashboard" && git push origin main
# Vercel detectează → build → live în ~60 secunde
```

**`README.md`** — include:
- Screenshot dashboard
- Flow simplu în 3 pași (cum funcționează)
- Stack tehnic (badges)
- Instrucțiuni fork + setup
- Disclaimer bani simulați
- Link live: `https://prophet-clone.vercel.app`

---

## Checklist final

### Securitate
- [ ] `.env.local` și `agent/.env` în `.gitignore`
- [ ] RLS activat pe ambele tabele Supabase
- [ ] `SUPABASE_SERVICE_ROLE_KEY` niciodată în Vercel sau git
- [ ] Nicio cheie secretă în codul sursă

### Funcționalitate
- [ ] `scan_odds.py` plasează sau skip-uiește corect
- [ ] `settle_bets.py` actualizează status + bankroll
- [ ] Hermes cron activ (`hermes cron list`)
- [ ] Dashboard afișează date reale
- [ ] `/history` filtrează și paginează corect
- [ ] Grafic bankroll animat
- [ ] Site responsiv pe mobil

### Deploy
- [ ] Pagina `/blog` afișează diary entries generate de AI
- [ ] `write_diary.py` rulează fără erori și scrie în DB
- [ ] `git push main` → deploy automat Vercel
- [ ] Variabilele publice setate în Vercel
- [ ] `ADMIN_KEY` setat în Vercel (Settings → Environment Variables)
- [ ] URL live funcțional: `prophet-clone.vercel.app`
- [ ] Pagina `/admin?key=...` salvată în bookmarks

### Polish
- [ ] Disclaimer "simulated" vizibil în footer
- [ ] FAQ complet
- [ ] README cu screenshot și link live
- [ ] Favicon personalizat
- [ ] Meta tags completate

---

## Buget timp (2 săptămâni)

| Zi | Task |
|----|------|
| 1 | Setup repo, Next.js, conturi (Supabase, Odds API, Anthropic, Vercel) |
| 2 | Schema SQL + RLS în Supabase |
| 3 | `scan_odds.py` complet + testat |
| 4 | `settle_bets.py` complet + testat |
| 5 | Hermes skills + cron configurat + test end-to-end |
| 6–7 | `lib/` — types, stats, supabase clients |
| 8–9 | API routes (`/api/bets`, `/api/stats`) |
| 10–11 | Componente UI (StatsBar, Chart, BetCard, BetTable, FAQ) + pagina `/admin` |
| 12–13 | Pagini complete (Dashboard, History, Layout + Blog/Diary) |
| 14 | Vercel deploy + README + polish final |

---

## Costuri finale

| Serviciu | Plan | Cost/lună |
|---|---|---|
| Vercel | Hobby | Gratuit |
| Supabase | Free (500MB) | Gratuit |
| The Odds API | Free (500 req/lună) | Gratuit |
| Claude API (Opus) | scan: 6×/zi × $0.10/run | ~$18–20/lună |
| Claude API (Sonnet) | diary: 1×/zi × $0.003 | ~$0.10/lună |
| **Total** | | **~$20/lună** |

> **Reducere costuri:** Dacă ai acces la Opus prin Hermes model relay, verifică dacă
> prețul e mai bun decât API direct. Autorul original rulează Opus prin Cursor CLI
> (~$0.10/run față de ~$0.20 prin API direct). Sonnet rămâne pentru diary și research.

> **The Odds API:** 2 sporturi × 6 scan-uri/zi = 12 req/zi = ~360/lună → în limita free tier de 500 ✓
