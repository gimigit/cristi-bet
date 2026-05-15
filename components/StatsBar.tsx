'use client'

import { Stats } from '@/lib/types'
import { formatPct, formatRon } from '@/lib/stats'

interface Props {
  stats: Stats
}

export default function StatsBar({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
        <div className="text-xs text-[var(--muted)] mb-1">Bankroll</div>
        <div className="text-xl font-bold text-[var(--text)]">
          RON {stats.bankroll.toFixed(2)}
        </div>
        <div className="text-xs text-[var(--muted)]">started RON {stats.startingBankroll.toFixed(2)}</div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
        <div className="text-xs text-[var(--muted)] mb-1">P&L</div>
        <div className={`text-xl font-bold ${stats.pnl >= 0 ? 'text-[var(--won)]' : 'text-[var(--lost)]'}`}>
          {formatRon(stats.pnl)}
        </div>
        <div className="text-xs text-[var(--muted)]">{stats.totalBets} bets</div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
        <div className="text-xs text-[var(--muted)] mb-1">ROI</div>
        <div className={`text-xl font-bold ${stats.roi >= 0 ? 'text-[var(--won)]' : 'text-[var(--lost)]'}`}>
          {formatPct(stats.roi)}
        </div>
        <div className="text-xs text-[var(--muted)]">avg odds {stats.avgOdds.toFixed(2)}</div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
        <div className="text-xs text-[var(--muted)] mb-1">Win Rate</div>
        <div className="text-xl font-bold text-[var(--text)]">
          {stats.winRate}%
        </div>
        <div className="text-xs text-[var(--muted)]">{stats.wins}W / {stats.losses}L</div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
        <div className="text-xs text-[var(--muted)] mb-1">Streak</div>
        <div className={`text-xl font-bold ${
          stats.streakType === 'W' ? 'text-[var(--won)]' : 
          stats.streakType === 'L' ? 'text-[var(--lost)]' : 'text-[var(--muted)]'
        }`}>
          {stats.streakType === '-' ? '—' : `${stats.currentStreak}${stats.streakType}`}
        </div>
        <div className="text-xs text-[var(--muted)]">current</div>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-4">
        <div className="text-xs text-[var(--muted)] mb-1">Open</div>
        <div className="text-xl font-bold text-[var(--open)]">
          {stats.open}
        </div>
        <div className="text-xs text-[var(--muted)]">bets in play</div>
      </div>
    </div>
  )
}