     1|     1|'use client'
     2|     2|
     3|     3|import { useState } from 'react'
     4|     4|import { Bet } from '@/lib/types'
     5|     5|import { sportLabel } from '@/lib/stats'
     6|     6|
     7|     7|interface Props {
     8|     8|  bet: Bet
     9|     9|  compact?: boolean
    10|    10|}
    11|    11|
    12|    12|export default function BetCard({ bet, compact = false }: Props) {
    13|    13|  const [expanded, setExpanded] = useState(false)
    14|    14|
    15|    15|  const statusColors: Record<string, string> = {
    16|    16|    WON: 'badge-won',
    17|    17|    LOST: 'badge-lost',
    18|    18|    OPEN: 'badge-open',
    19|    19|    PUSH: 'badge-push',
    20|    20|    VOID: 'badge-push',
    21|    21|  }
    22|    22|
    23|    23|  const statusIcons: Record<string, string> = {
    24|    24|    WON: '✓',
    25|    25|    LOST: '✗',
    26|    26|    OPEN: '○',
    27|    27|    PUSH: '~',
    28|    28|    VOID: '∅',
    29|    29|  }
    30|    30|
    31|    31|  const badge = statusColors[bet.status] ?? 'badge-open'
    32|    32|  const icon = statusIcons[bet.status] ?? '○'
    33|    33|
    34|    34|  const pnlColor =
    35|    35|    bet.status === 'WON'
    36|    36|      ? 'text-[var(--won)]'
    37|    37|      : bet.status === 'LOST'
    38|    38|      ? 'text-[var(--lost)]'
    39|    39|      : 'text-[var(--muted)]'
    40|    40|
    41|    41|  const pnlDisplay =
    42|    42|    bet.status === 'OPEN'
    43|    43|      ? `RON ${bet.stake.toFixed(2)} at risk`
    44|    44|      : bet.pnl !== null
    45|    45|      ? `RON ${bet.pnl >= 0 ? '+' : ''}${bet.pnl.toFixed(2)}`
    46|    46|      : '—'
    47|    47|
    48|    48|  const confidenceColor =
    49|    49|    bet.confidence >= 75
    50|    50|      ? 'text-[var(--won)]'
    51|    51|      : bet.confidence >= 60
    52|    52|      ? 'text-[var(--push)]'
    53|    53|      : 'text-[var(--muted)]'
    54|    54|
    55|    55|  const stakePct = ((bet.stake / 10) * 100).toFixed(1)
    56|    56|
    57|    57|  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(bet.event + ' ' + bet.selection)}`
    58|    58|
    59|    59|  const formattedDate = new Date(bet.event_date).toLocaleDateString('en-GB', {
    60|    60|    day: '2-digit',
    61|    61|    month: 'short',
    62|    62|    hour: '2-digit',
    63|    63|    minute: '2-digit',
    64|    64|  })
    65|    65|
    66|    66|  if (compact) {
    67|    67|    return (
    68|    68|      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 flex items-center justify-between gap-3">
    69|    69|        <div className="flex-1 min-w-0">
    70|    70|          <div className="flex items-center gap-2 mb-1">
    71|    71|            <span className="text-xs font-mono text-[var(--muted)]">{bet.id}</span>
    72|    72|            <span className="text-xs text-[var(--muted)]">·</span>
    73|    73|            <span className="text-xs text-[var(--muted)]">{sportLabel(bet.sport)}</span>
    74|    74|          </div>
    75|    75|          <p className="text-sm font-medium truncate">{bet.event}</p>
    76|    76|          <p className="text-xs text-[var(--muted)] truncate">{bet.selection} @ {bet.odds}</p>
    77|    77|        </div>
    78|    78|        <div className="flex items-center gap-2 shrink-0">
    79|    79|          <span className={`text-xs font-bold ${pnlColor}`}>{pnlDisplay}</span>
    80|    80|          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${badge}`}>
    81|    81|            {icon} {bet.status}
    82|    82|          </span>
    83|    83|        </div>
    84|    84|      </div>
    85|    85|    )
    86|    86|  }
    87|    87|
    88|    88|  return (
    89|    89|    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
    90|    90|      {/* Header */}
    91|    91|      <div className="flex items-start justify-between gap-3 p-4">
    92|    92|        <div className="flex-1 min-w-0">
    93|    93|          <div className="flex items-center gap-2 mb-1 flex-wrap">
    94|    94|            <span className="text-xs font-mono text-[var(--muted)]">{bet.id}</span>
    95|    95|            <span className="text-xs text-[var(--muted)]">·</span>
    96|    96|            <span className="text-xs text-[var(--muted)]">{bet.league}</span>
    97|    97|            <span className="text-xs text-[var(--muted)]">·</span>
    98|    98|            <span className="text-xs text-[var(--muted)] uppercase">{bet.market}</span>
    99|    99|          </div>
   100|   100|          <p className="font-medium text-sm">{bet.event}</p>
   101|   101|          <p className="text-sm text-[var(--muted)]">{bet.selection} @ {bet.odds}</p>
   102|   102|        </div>
   103|   103|        <div className="flex flex-col items-end gap-1 shrink-0">
   104|   104|          <span className={`text-sm font-bold ${pnlColor}`}>{pnlDisplay}</span>
   105|   105|          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${badge}`}>
   106|   106|            {icon} {bet.status}
   107|   107|          </span>
   108|   108|        </div>
   109|   109|      </div>
   110|   110|
   111|   111|      {/* Meta */}
   112|   112|      <div className="flex items-center justify-between px-4 pb-3 text-xs text-[var(--muted)]">
   113|   113|        <div className="flex items-center gap-3">
   114|   114|          <span>🕒 {formattedDate}</span>
   115|   115|          <span>
   116|   116|            Stake: RON {bet.stake.toFixed(2)} · {stakePct}% BR
   117|   117|          </span>
   118|   118|        </div>
   119|   119|        <span className={`${confidenceColor}`}>
   120|   120|          {bet.confidence}% confidence
   121|   121|        </span>
   122|   122|      </div>
   123|   123|
   124|   124|      {/* Rationale */}
   125|   125|      {bet.rationale && (
   126|   126|        <div className="border-t border-[var(--border)]">
   127|   127|          <button
   128|   128|            onClick={() => setExpanded(!expanded)}
   129|   129|            className="w-full px-4 py-2 text-xs text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/30 transition-colors flex items-center justify-between"
   130|   130|          >
   131|   131|            <span>💡 AI Rationale</span>
   132|   132|            <span>{expanded ? '▲' : '▼'}</span>
   133|   133|          </button>
   134|   134|          {expanded && (
   135|   135|            <div className="px-4 pb-4 pt-1">
   136|   136|              <p className="text-xs text-[var(--muted)] leading-relaxed">{bet.rationale}</p>
   137|   137|            </div>
   138|   138|          )}
   139|   139|        </div>
   140|   140|      )}
   141|   141|
   142|   142|      {/* Footer — Follow link */}
   143|   143|      {bet.status === 'OPEN' && (
   144|   144|        <div className="border-t border-[var(--border)] px-4 py-2 flex justify-end">
   145|   145|          <a
   146|   146|            href={googleSearchUrl}
   147|   147|            target="_blank"
   148|   148|            rel="noopener noreferrer"
   149|   149|            className="text-xs text-[var(--open)] hover:text-[var(--text)] transition-colors flex items-center gap-1"
   150|   150|          >
   151|   151|            Follow → Google
   152|   152|          </a>
   153|   153|        </div>
   154|   154|      )}
   155|   155|    </div>
   156|   156|  )
   157|   157|}
   158|   158|