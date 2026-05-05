# ProphetAI Clone — Status

## ✅ Ziua 1 — Setup repo + Next.js (fișiere generate)
## ⏳ Ziua 2 — Schema Supabase
## ⬜ Ziua 3 — scan_odds.py
## ⬜ Ziua 4 — settle_bets.py + write_diary.py
## ⬜ Ziua 5 — launchd setup + test end-to-end
## ⬜ Ziua 6-7 — Types + Utilities
## ⬜ Ziua 8-9 — API Routes
## ⬜ Ziua 10-11 — Componente UI + /admin
## ⬜ Ziua 12-13 — Pagini complete (Dashboard, History, Blog)
## ⬜ Ziua 14 — Deploy + Polish

---

## 📖 Insights din autorul original ProphetAI (Reddit)

- **Opus pentru decizie** — GPT refuză 1/2, Minimax halucinează și otrăvește ledger-ul
- **Sonnet pentru diary** — suficient pentru text creativ, ~10x mai ieftin
- **launchd în loc de Hermes cron** — mai stabil pe macOS, fără blockages
- **Python wrapper de validare** — validăm TOTUL înainte de scriere în DB (anti-halucinare)
- **Cost real:** ~$0.10-0.20/run pe Opus = ~$18-20/lună total
- **Logs la fiecare run** — esențial pentru debug și monitorizare

---

## 🔧 Acțiuni necesare de la tine

### Ziua 1 — ⏳ În așteptare
- [ ] Creează cont [supabase.com](https://supabase.com) → New Project → `prophet-clone` → `eu-central-1`
- [ ] Creează cont [the-odds-api.com](https://the-odds-api.com) → copiezi API key
- [ ] Creează cont [console.anthropic.com](https://console.anthropic.com) → adaugi $5-10 credit → copiezi key
- [ ] Creează cont [vercel.com](https://vercel.com) → login cu GitHub
- [ ] Rulează în terminal:
  ```bash
  cd ~/Desktop
  mkdir prophet-clone && cd prophet-clone
  git init
  gh repo create prophet-clone --public --source=. --remote=origin
  ```
- [ ] Copiază toate fișierele din zip în folderul `prophet-clone/`
- [ ] Rulează:
  ```bash
  npm install
  cp .env.example .env.local
  # completează .env.local cu key-urile tale
  npm run dev
  ```
- [ ] Confirmă că `http://localhost:3000` se deschide fără erori → **anunță-mă**

### Ziua 2 — Schema Supabase (după confirmare Ziua 1)
- [ ] Va fi adăugat după confirmare ✓

---

## 📁 Fișiere generate până acum

```
prophet-clone/
├── app/
│   ├── layout.tsx          ✅
│   ├── page.tsx            ✅ (placeholder)
│   └── globals.css         ✅
├── lib/
│   ├── types.ts            ✅
│   ├── supabase.ts         ✅
│   ├── supabase-server.ts  ✅
│   └── stats.ts            ✅
├── agent/
│   ├── scripts/
│   │   ├── scan_odds.py    ✅ (Opus + validator)
│   │   ├── settle_bets.py  ✅
│   │   └── write_diary.py  ✅ (Sonnet)
│   ├── setup_launchd.sh    ✅
│   └── requirements.txt    ✅
├── package.json            ✅
├── next.config.ts          ✅
├── tailwind.config.ts      ✅
├── tsconfig.json           ✅
├── .gitignore              ✅
├── .env.example            ✅
└── README.md               ✅
```
