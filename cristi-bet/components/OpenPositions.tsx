'use client'

import { Bet } from '@/lib/types'
import BetCard from './BetCard'

interface Props {
  bets: Bet[]
  bankroll: number
}

export default function OpenPositions({ bets, bankroll }: Props) {
  if (bets.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
        <h2 className="text-sm font-medium text-[var(--muted)] mb-4">Open Positions</h2>
        <p className="text-[var(--muted)] text-sm text-center py-4">No open bets</p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
      <h2 className="text-sm font-medium text-[var(--muted)] mb-4">
        Open Positions ({bets.length})
      </h2>
      <div className="space-y-3">
        {bets.map(bet => (
          <BetCard key={bet.id} bet={bet} bankroll={bankroll} />
        ))}
      </div>
    </div>
  )
}