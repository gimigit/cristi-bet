import { createServerClient } from '@/lib/supabase-server'
import { computeStats } from '@/lib/stats'
import StatsBar from '@/components/StatsBar'
import BankrollChart from '@/components/BankrollChart'
import OpenPositions from '@/components/OpenPositions'
import RecentResults from '@/components/RecentResults'
import SportBreakdown from '@/components/SportBreakdown'
import FAQ from '@/components/FAQ'

export const revalidate = 60

export default async function Home() {
  const db = createServerClient()
  
  const [betsRes, bankrollRes] = await Promise.all([
    db.from('bets').select('*').order('placed_at', { ascending: false }),
    db.from('bankroll_history').select('*').order('recorded_at'),
  ])

  const bets = betsRes.data ?? []
  const bankrollHistory = bankrollRes.data ?? []
  const stats = computeStats(bets, bankrollHistory)
  const currentBankroll = bankrollHistory.at(-1)?.balance ?? stats.startingBankroll

  const openBets = bets.filter(b => b.status === 'OPEN')
  const recentBets = bets.filter(b => b.status !== 'OPEN').slice(0, 5)

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Dashboard</h1>
        <p className="text-[var(--muted)] text-sm">
          AI-powered sports betting tracker • Simulated bankroll
        </p>
      </div>

      <StatsBar stats={stats} />

      <div className="grid md:grid-cols-2 gap-6">
        <BankrollChart data={bankrollHistory} />
        <SportBreakdown stats={stats.bySport} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <OpenPositions bets={openBets} bankroll={currentBankroll} />
        <RecentResults bets={recentBets} bankroll={currentBankroll} />
      </div>

      <FAQ />
    </div>
  )
}