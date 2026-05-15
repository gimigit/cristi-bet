'use client'

import { DiaryEntry as DiaryEntryType } from '@/lib/types'

interface Props {
  entry: DiaryEntryType
}

export default function DiaryEntry({ entry }: Props) {
  const date = new Date(entry.date)
  const formattedDate = date.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <article className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-[var(--muted)]">{formattedDate}</h2>
        <div className="flex gap-4 text-xs text-[var(--muted)]">
          <span className="text-[var(--won)]">✓ {entry.wins} wins</span>
          <span className="text-[var(--lost)]">✗ {entry.losses} losses</span>
          <span className={entry.pnl >= 0 ? 'text-[var(--won)]' : 'text-[var(--lost)]'}>
            P&L: RON {entry.pnl >= 0 ? '+' : ''}{entry.pnl.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="prose prose-invert prose-sm max-w-none">
        {entry.content.split('\n\n').map((paragraph, i) => (
          <p key={i} className="text-[var(--text)] leading-relaxed mb-4">{paragraph}</p>
        ))}
      </div>
    </article>
  )
}