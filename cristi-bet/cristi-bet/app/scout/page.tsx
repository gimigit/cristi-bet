'use client'

import { useState, useEffect } from 'react'

interface PendingBet {
  id: number
  sport: string
  event_name: string
  league: string | null
  match_date: string | null
  market: string
  selection: string
  odds: number
  stake: number | null
  reason: string | null
  confidence: number | null
  category: 'scout' | 'manual'
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  source: string
  created_at: string
  accepted_at: string | null
  rejected_at: string | null
  bet_id: string | null
}

const SPORT_EMOJIS: Record<string, string> = {
  soccer: '⚽',
  basketball: '🏀',
  americanfootball: '🏈',
  baseball: '⚾',
  icehockey: '🏒',
}

function sportEmoji(sport: string): string {
  for (const [key, emoji] of Object.entries(SPORT_EMOJIS)) {
    if (sport.includes(key)) return emoji
  }
  return '🎯'
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleString('ro-RO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ScoutPage() {
  const [pending, setPending] = useState<PendingBet[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [filter, setFilter] = useState<string>('pending')
  const [editingStake, setEditingStake] = useState<number | null>(null)
  const [stakeValue, setStakeValue] = useState('')

  async function fetchPending() {
    try {
      const r = await fetch('/api/scout')
      const d = await r.json()
      setPending(d.pending ?? [])
    } catch {
      // silent
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPending()
  }, [])

  async function handleAccept(id: number) {
    setActionLoading(id)
    await fetch('/api/scout', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'accept' }),
    })
    await fetchPending()
    setActionLoading(null)
  }

  async function handleReject(id: number) {
    setActionLoading(id)
    await fetch('/api/scout', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'reject' }),
    })
    await fetchPending()
    setActionLoading(null)
  }

  async function handleStakeUpdate(id: number) {
    const val = parseFloat(stakeValue)
    if (isNaN(val) || val <= 0) return
    await fetch('/api/scout', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'stake', stake: val }),
    })
    setEditingStake(null)
    setStakeValue('')
    await fetchPending()
  }

  async function handleDelete(id: number) {
    if (!confirm('Ștergi această recomandare?')) return
    await fetch('/api/scout', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await fetchPending()
  }

  const filtered = pending.filter(b => filter === 'all' || b.status === filter)
  const pendingCount = pending.filter(b => b.status === 'pending').length

  return (
    <main className="min-h-screen bg-[var(--bg)] p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text)] mb-2">
          🕵️ Scout — Recomandări AI
        </h1>
        <p className="text-[var(--muted)]">
          CristiBet AI scanează odds și îți propune ponturi. Tu alegi ce acceptai.
          {pendingCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
              {pendingCount} noi
            </span>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['pending', 'accepted', 'rejected', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
              filter === f
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)] border border-[var(--border)]'
            }`}
          >
            {f === 'pending' ? '📥 În așteptare' :
             f === 'accepted' ? '✅ Acceptate' :
             f === 'rejected' ? '❌ Respinse' : '📋 Toate'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-[var(--muted)]">Se încarcă...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted)]">
          {filter === 'pending'
            ? '🎉 Nicio recomandare în așteptare. AI-ul încă scanează...'
            : 'Nicio recomandare în această categorie.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(bet => (
            <div
              key={bet.id}
              className={`p-5 bg-[var(--surface)] border rounded-xl transition-all ${
                bet.status === 'pending'
                  ? 'border-yellow-500/30 shadow-lg shadow-yellow-500/5'
                  : bet.status === 'accepted'
                  ? 'border-green-500/20 opacity-80'
                  : 'border-red-500/10 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{sportEmoji(bet.sport)}</span>
                    <span className="text-xs px-2 py-0.5 bg-[var(--bg)] rounded text-[var(--muted)] font-mono">
                      {bet.sport.replace(/_/g, ' ')}
                    </span>
                    {bet.league && (
                      <span className="text-xs text-[var(--muted)]">{bet.league}</span>
                    )}
                    {bet.category === 'manual' && (
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                        manual
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-[var(--text)] truncate">
                    {bet.event_name}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
                    <span className="font-mono text-[var(--accent)] font-bold">
                      {bet.selection} @ {bet.odds.toFixed(2)}
                    </span>
                    {bet.stake && (
                      <span>Miză: <strong className="text-[var(--text)]">${bet.stake.toFixed(2)}</strong></span>
                    )}
                    {bet.confidence && (
                      <span>
                        Încredere:{' '}
                        <span className={
                          bet.confidence >= 8 ? 'text-green-400' :
                          bet.confidence >= 5 ? 'text-yellow-400' :
                          'text-red-400'
                        }>
                          {bet.confidence}/10
                        </span>
                      </span>
                    )}
                    <span>📅 {formatDate(bet.match_date)}</span>
                  </div>

                  {bet.reason && bet.status === 'pending' && (
                    <p className="mt-2 text-sm text-[var(--muted)] italic border-l-2 border-[var(--border)] pl-3">
                      {bet.reason}
                    </p>
                  )}
                </div>

                {/* Right: actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {bet.status === 'pending' && (
                    <>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(bet.id)}
                          disabled={actionLoading === bet.id}
                          className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50
                                     text-white text-sm rounded-lg font-medium transition-colors"
                        >
                          {actionLoading === bet.id ? '...' : '✅ Accept'}
                        </button>
                        <button
                          onClick={() => handleReject(bet.id)}
                          disabled={actionLoading === bet.id}
                          className="px-4 py-2 bg-red-600/50 hover:bg-red-500/70 disabled:opacity-50
                                     text-white text-sm rounded-lg transition-colors"
                        >
                          ❌
                        </button>
                      </div>

                      {/* Stake editor */}
                      <div className="flex items-center gap-1">
                        {editingStake === bet.id ? (
                          <>
                            <span className="text-xs text-[var(--muted)]">$</span>
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              value={stakeValue}
                              onChange={e => setStakeValue(e.target.value)}
                              autoFocus
                              className="w-20 px-2 py-1 text-sm bg-[var(--bg)] border border-[var(--border)]
                                         rounded text-[var(--text)] text-center"
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleStakeUpdate(bet.id)
                                if (e.key === 'Escape') setEditingStake(null)
                              }}
                            />
                            <button
                              onClick={() => handleStakeUpdate(bet.id)}
                              className="text-xs text-[var(--accent)] hover:underline"
                            >
                              salvează
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => { setEditingStake(bet.id); setStakeValue(bet.stake?.toString() ?? '5') }}
                            className="text-xs text-[var(--muted)] hover:text-[var(--accent)]"
                          >
                            {bet.stake ? `$${bet.stake.toFixed(2)}` : '💰 set stake'}
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {bet.status === 'accepted' && bet.bet_id && (
                    <div className="text-right">
                      <span className="text-xs text-green-400">✅ Acceptat</span>
                      <br />
                      <span className="text-xs font-mono text-[var(--muted)]">{bet.bet_id}</span>
                    </div>
                  )}

                  {bet.status === 'rejected' && (
                    <span className="text-xs text-red-400">❌ Respins</span>
                  )}

                  {/* Delete button for non-pending */}
                  {bet.status !== 'pending' && (
                    <button
                      onClick={() => handleDelete(bet.id)}
                      className="text-xs text-[var(--muted)] hover:text-red-400 transition-colors"
                    >
                      șterge
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 pt-6 border-t border-[var(--border)] flex items-center justify-between">
        <a href="/" className="text-sm text-[var(--accent)] hover:underline">
          ← Înapoi la Dashboard
        </a>
        <a href="/history" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">
          History →
        </a>
      </div>
    </main>
  )
}
