import Link from "next/link"

// Dashboard complet vine în Zilele 10-13
// Până atunci: placeholder cu info de setup

export default function Home() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-6">⚽</div>
      <h1 className="text-3xl font-bold mb-2">CristiBet</h1>
      <p className="text-[var(--muted)] text-lg mb-8">
        AI Sports Betting Agent — simulated bankroll
      </p>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 max-w-lg w-full text-left space-y-4">

        <div className="flex items-start gap-3">
          <span className="text-[var(--won)] mt-0.5">✓</span>
          <div>
            <p className="text-sm font-medium">Next.js + Supabase + Tailwind</p>
            <p className="text-xs text-[var(--muted)]">Stack tehnic configurat</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-[var(--open)] mt-0.5">○</span>
          <div>
            <p className="text-sm font-medium">Schema DB — SQL migration gata</p>
            <p className="text-xs text-[var(--muted)]">Rulare în Supabase Dashboard</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-[var(--muted)] mt-0.5">○</span>
          <div>
            <p className="text-sm font-medium">Conturi de configurat</p>
            <p className="text-xs text-[var(--muted)]">
              Supabase · The Odds API · Hermes Agent
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-[var(--muted)] mt-0.5">○</span>
          <div>
            <p className="text-sm font-medium">Agent Python (scan + settle)</p>
            <p className="text-xs text-[var(--muted)]">
              De scris în Zilele 3-4
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span className="text-[var(--muted)] mt-0.5">○</span>
          <div>
            <p className="text-sm font-medium">Dashboard UI complet</p>
            <p className="text-xs text-[var(--muted)]">
              Stats, chart, bet cards — Zilele 10-13
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Link
          href="/history"
          className="px-5 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm hover:border-[var(--muted)] transition-colors"
        >
          History →
        </Link>
        <Link
          href="/blog"
          className="px-5 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm hover:border-[var(--muted)] transition-colors"
        >
          The Diary →
        </Link>
      </div>

      <p className="mt-8 text-xs text-[var(--muted)]">
        Bankroll start: €10.00 · EUR · Simulated only
      </p>
    </div>
  )
}
