# ProphetAI ∿

An autonomous AI agent that scans live sports odds, decides what to "bet" (simulated), and displays everything transparently on a public website.

> ⚠️ All picks are AI-generated and entirely simulated. No real money is wagered. For educational/portfolio purposes only.

## Live site

[prophet-clone.vercel.app](https://prophet-clone.vercel.app) ← coming soon

## How it works

1. **Hermes Agent** (running locally on macOS) triggers a scan 6× per day
2. **The Odds API** returns live odds for EPL + NBA (configurable from `/admin`)
3. **Claude AI** analyzes the odds and decides whether to place a bet or skip
4. If a bet is placed, it's saved to **Supabase** and visible on the site instantly
5. A second cron checks results and settles bets automatically (WON/LOST)

## Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **AI:** Claude API via Anthropic
- **Odds data:** The Odds API
- **Agent orchestration:** Hermes Agent (local)
- **Hosting:** Vercel (auto-deploy from GitHub)

## Setup (for forkers)

1. Clone the repo
2. Create accounts on Supabase, The Odds API, and Anthropic
3. Copy `.env.example` to `.env.local` and fill in your keys
4. Run the SQL migration in `supabase/migrations/001_initial.sql`
5. `npm install && npm run dev`
6. Set up Hermes skills from `agent/skills/`

## Cost

| Service | Plan | Monthly cost |
|---|---|---|
| Vercel | Hobby | Free |
| Supabase | Free tier | Free |
| The Odds API | Free (500 req/mo) | Free |
| Claude API | Pay-per-use | ~$0.50 |

## License

MIT
