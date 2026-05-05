'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Bet } from '@/lib/types'
import BetCard from '@/components/BetCard'
import { sportLabel } from '@/lib/stats'

const STATUS_OPTIONS = ['ALL', 'OPEN', 'WON', 'LOST', 'PUSH', 'VOID']
const SPORT_OPTIONS = [
  'ALL',
  'soccer',
  'basketball',
  'americanfootball',
  'baseball',
  'icehockey',
  'tennis',
  'mma',
]

export default function HistoryPage() {
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('ALL')
  const [sport, setSport] = useState('ALL')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const fetchBets = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status !== 'ALL') params.set('status', status)
    if (sport !== 'ALL') params.set('sport', sport)
    params.set('limit', '200')

    fetch(`/api/bets?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setBets(Array.isArray(data) ? data : [])
        setLoading(false)
        setPage(1)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchBets()
  }, [status, sport])

  const totalPages = Math.max(1, Math.ceil(bets.length / PAGE_SIZE))
  const paginated = bets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bet History</h1>
          <p className="text-[var(--muted)] text-sm mt-0.5">
            {bets.length} total bets · Page {page} of {totalPages}
          </p>
        </div>
        <button
          onClick={fetchBets}
          className="px-3 py-1.5 text-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:border-[var(--muted)] transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Status filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Status</label>
          <div className="flex flex-wrap gap-1">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  status === s
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Sport filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--muted)] uppercase tracking-wider">Sport</label>
          <div className="flex flex-wrap gap-1">
            {SPORT_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSport(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  sport === s
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {s === 'ALL' ? 'All' : sportLabel(s)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-12 text-center">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-[var(--muted)]">No bets match the current filters.</p>
          <p className="text-[var(--muted)] text-xs mt-1">Try changing the status or sport filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((bet) => (
            <BetCard key={bet.id} bet={bet} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm disabled:opacity-30 hover:border-[var(--muted)] transition-colors"
          >
            ← Prev
          </button>
          <span className="text-sm text-[var(--muted)] px-3">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm disabled:opacity-30 hover:border-[var(--muted)] transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
