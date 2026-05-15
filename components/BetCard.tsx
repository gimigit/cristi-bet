'use client'

import { useState } from 'react'
import { Bet } from '@/lib/types'
import { sportLabel } from '@/lib/stats'

interface Props {
  bet: Bet
  compact?: boolean
  bankroll?: number
}

export default function BetCard({ bet, compact = false, bankroll = 10 }: Props) {
  const [expanded, setExpanded] = useState(false)

  const statusColors: Record<string, string> = {
    WON: 'badge-won',
    LOST: 'badge-lost',
    OPEN: 'badge-open',
    PUSH: 'badge-push',
    VOID: 'badge-push',
  }

  const statusIcons: Record<string, string> = {
    WON: '✓',
    LOST: '✗',
    OPEN: '○',
    PUSH: '~',
    VOID: '∅',
  }

  const badge = statusColors[bet.status] ?? 'badge-open'
  const icon = statusIcons[bet.status] ?? '○'

  const pnlColor =
    bet.status === 'WON'
      ? 'text-[var(--won)]'
      : bet.status === 'LOST'
      ? 'text-[var(--lost)]'
      : 'text-[var(--muted)]'

  const pnlDisplay =
    bet.status === 'OPEN'
      ? `RON ${bet.stake.toFixed(2)} at risk`
      : bet.pnl !== null
      ? `RON ${bet.pnl >= 0 ? '+' : ''}${bet.pnl.toFixed(2)}`
      : '—'

  const confidenceColor =
    bet.confidence >= 75
      ? 'text-[var(--won)]'
      : bet.confidence >= 60
      ? 'text-[var(--push)]'
      : 'text-[var(--muted)]'

  const stakePct = ((bet.stake / bankroll) * 100).toFixed(1)

  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(bet.event + ' ' + bet.selection)}`

  const formattedDate = new Date(bet.event_date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  if (compact) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-[var(--muted)]">{bet.id}</span>
            <span className="text-xs text-[var(--muted)]">·</span>
            <span className="text-xs text-[var(--muted)]">{sportLabel(bet.sport)}</span>
          </div>
          <p className="text-sm font-medium truncate">{bet.event}</p>
          <p className="text-xs text-[var(--muted)] truncate">{bet.selection} @ {bet.odds}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-bold ${pnlColor}`}>{pnlDisplay}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${badge}`}>
            {icon} {bet.status}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono text-[var(--muted)]">{bet.id}</span>
            <span className="text-xs text-[var(--muted)]">·</span>
            <span className="text-xs text-[var(--muted)]">{bet.league}</span>
            <span className="text-xs text-[var(--muted)]">·</span>
            <span className="text-xs text-[var(--muted)] uppercase">{bet.market}</span>
          </div>
          <p className="font-medium text-sm">{bet.event}</p>
          <p className="text-sm text-[var(--muted)]">{bet.selection} @ {bet.odds}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-sm font-bold ${pnlColor}`}>{pnlDisplay}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${badge}`}>
            {icon} {bet.status}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between px-4 pb-3 text-xs text-[var(--muted)]">
        <div className="flex items-center gap-3">
          <span>🕒 {formattedDate}</span>
          <span>
            Stake: RON {bet.stake.toFixed(2)} · {stakePct}% BR
          </span>
        </div>
        <span className={`${confidenceColor}`}>
          {bet.confidence}% confidence
        </span>
      </div>

      {/* Rationale */}
      {bet.rationale && (
        <div className="border-t border-[var(--border)]">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-2 text-xs text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/30 transition-colors flex items-center justify-between"
          >
            <span>💡 AI Rationale</span>
            <span>{expanded ? '▲' : '▼'}</span>
          </button>
          {expanded && (
            <div className="px-4 pb-4 pt-1">
              <p className="text-xs text-[var(--muted)] leading-relaxed">{bet.rationale}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {bet.status === 'OPEN' && (
        <div className="border-t border-[var(--border)] px-4 py-2 flex justify-end">
          <a
            href={googleSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--open)] hover:text-[var(--text)] transition-colors flex items-center gap-1"
          >
            Follow → Google
          </a>
        </div>
      )}
    </div>
  )
}
