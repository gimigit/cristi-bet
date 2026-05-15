# CristiBet — Plan

AI betting assistant. Scanează cote live din The Odds API, Hermes Agent evaluează pariurile, plasează automat în baza de date Supabase.

---

## 🎯 Funcționalitate

- Scanează cote live din The Odds API (soccer, basketball, tennis)
- Hermes Agent (OpenAI-compatible, local la http://127.0.0.1:7352/v1) evaluează fiecare meci
- Plasează pariuri automat cu stake calculat 5-10% din bankroll
- Verifică rezultate și face settle după meci
- Generează daily diary cu rezumat narativ
- Dashboard public cu stats live

---

## 🏗️ Arhitectură

```
cristi-bet/
├── app/                    # Next.js 16 App Router
│   ├── page.tsx           # Homepage (dashboard public)
│   ├── admin/page.tsx     # Admin panel (parcuri manual)
│   ├── blog/page.tsx      # Diary feed
│   └── api/               # API routes
├── components/            # UI components
├── lib/                   # Utilities (stats, supabase, types)
├── agent/
│   ├── .env               # API keys (NEVER commit!)
│   └── scripts/           # Python cron jobs
└── supabase/
    ├── schema.sql         # DB schema + RLS
    └── migrations/        # SQL migrations
```

---

## 📡 API Routes

| Endpoint | Metodă | Scop |
|----------|--------|------|
| `/api/bets` | GET | Lista pariuri (public) |
| `/api/bets` | POST | Plasează pariu nou (admin) |
| `/api/config` | GET/POST | Config (admin key) |
| `/api/stats` | GET | Stats pentru dashboard |
| `/api/diary` | GET | Blog posts |

---

## 🤖 Hermes Agent

**Endpoint:** `http://127.0.0.1:7352/v1` (local ModelRelay)

**Prompt pentru evaluare:**
- Sport key: `soccer`, `basketball`, `tennis`
- Confidence: 50-99%
- Condiții: odds 1.70-2.80, max 10% bankroll per bet
- Max 60% exposure per sport

**Validator înainte de scriere:**
- Verify sport key exists
- Verify odds between 1.70 and 2.80
- Verify stake ≤ 10% bankroll
- Check no duplicate bets

---

## 💰 Currency

**RON** — toate stake-urile și profiturile afișate în RON.

Starting bankroll: 10 RON (mutable din config table)

---

## 📊 Sport Keys (The Odds API)

| Sport | API Key |
|-------|---------|
| Soccer | `soccer` |
| Basketball | `basketball_nba` |
| Tennis | `tennis_atp_us_open` |
| Main Events | `soccer` + `basketball_nba` + `tennis_ata_us_open` |

---

## 📋 Cron Jobs

| Job | Frecvență | Script |
|-----|-----------|--------|
| Scan odds | 30 min | `agent/scripts/scan_odds.py` |
| Settle bets | 60 min | `agent/scripts/settle_bets.py` |
| Write diary | zilnic 23:55 | `agent/scripts/write_diary.py` |

---

## 🗄️ Supabase Schema

**Tables:**
- `bets` — pariuri (id, sport, league, home_team, away_team, odds, stake, status, confidence, timestamp)
- `bankroll` — sold curent (id, balance, updated_at)
- `config` — config key-value (bankroll_start, etc)
- `diary` — blog posts (id, date, content, summary)
- `profiles` — users (Supabase auth)

**RLS:**
- `bets`: SELECT public, INSERT/UPDATE admin only
- `bankroll`: SELECT public
- `config`: SELECT public, UPDATE admin only
- `diary`: SELECT public, INSERT admin only

---

## 🔒 Securitate

- Anon key: read-only (public)
- Service role: writes only în server-side
- ADMIN_KEY: separată pentru `/api/config`
- RLS enforced la DB level
- CORS blocked pe API routes

---

## 🎨 Design

- Dark terminal-inspired theme
- Font: JetBrains Mono
- Culori: green (#4ade80) WON, red (#f87171) LOST, yellow (#fbbf24) OPEN
- Fade-in animations pe bet cards
- Responsive grid layout

---

## 🚀 Deployment

- Vercel pentru frontend
- Supabase pentru DB
- Hermes Agent rulează local (nu pe Vercel)

---

## ⚠️ Reguli

1. NEVER commit `.env`, `agent/.env`, sau keys reale
2. Verifică build passes (`npm run build`) înainte de commit
3. Toate API routes trebuie să returneze JSON valid
4. Folosește Supabase RLS pentru security
5. Hermes agent prompts trebuie validate server-side

---

*Last updated: 2025-01-08*