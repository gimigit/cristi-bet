'use client'

import { Bet } from '@/lib/types'
import BetCard from './BetCard'

interface Props {
  bets: Bet[]
  bankroll: number
}

export default function RecentResults({ bets, bankroll }: Props) {
  if (bets.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <h2 className="text-sm font-medium text-[var(--muted)] mb-4">Recent Results</h2>
        <p className="text-[var(--muted)] text-sm text-center py-4">No settled bets yet</p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
      <h2 className="text-sm font-medium text-[var(--muted)] mb-4">
        Recent Results ({bets.length})
      </h2>
      <div className="space-y-3">
        {bets.map(bet => (
          <BetCard key={bet.id} bet={bet} compact bankroll={bankroll} />
        ))}
      </div>
    </div>
  )
}