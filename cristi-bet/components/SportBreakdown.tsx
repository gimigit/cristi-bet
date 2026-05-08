'use client'

import { SportStat } from '@/lib/types'
import { sportLabel } from '@/lib/stats'

interface Props {
  stats: SportStat[]
}

export default function SportBreakdown({ stats }: Props) {
  if (stats.length === 0) {
    return null
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
      <h2 className="text-sm font-medium text-[var(--muted)] mb-4">Performance by Sport</h2>
      <div className="space-y-3">
        {stats.map(s => {
          const winRate = s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0
          const isWin = s.pnl >= 0
          return (
            <div key={s.sport} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--text)]">{sportLabel(s.sport)}</span>
                <span className="text-xs text-[var(--muted)]">
                  {s.wins}/{s.total}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs ${isWin ? 'text-[var(--won)]' : 'text-[var(--lost)]'}`}>
                  RON {isWin ? '+' : ''}{s.pnl.toFixed(2)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  winRate >= 60 ? 'bg-[var(--won)]/20 text-[var(--won)]' :
                  winRate >= 40 ? 'bg-[var(--push)]/20 text-[var(--push)]' :
                  'bg-[var(--lost)]/20 text-[var(--lost)]'
                }`}>
                  {winRate}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}