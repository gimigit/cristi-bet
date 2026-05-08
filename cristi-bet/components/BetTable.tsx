'use client'

import { useState, useEffect } from 'react'
import { Bet } from '@/lib/types'
import BetCard from './BetCard'

export default function BetTable() {
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  useEffect(() => {
    fetch(`/api/bets?status=${statusFilter}&limit=100`)
      .then(r => r.json())
      .then(d => { setBets(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [statusFilter])

  if (loading) {
    return <div className="text-center py-8 text-[var(--muted)]">Loading...</div>
  }

  if (bets.length === 0) {
    return <div className="text-center py-8 text-[var(--muted)]">No bets found</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {(['ALL', 'OPEN', 'WON', 'LOST'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                statusFilter === s 
                  ? 'bg-[var(--accent)] text-white' 
                  : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {s === 'ALL' ? 'All' : s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded text-sm ${
              viewMode === 'table' ? 'bg-[var(--surface)] text-[var(--text)]' : 'text-[var(--muted)]'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded text-sm ${
              viewMode === 'cards' ? 'bg-[var(--surface)] text-[var(--text)]' : 'text-[var(--muted)]'
            }`}
          >
            Cards
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                <th className="text-left py-3 px-2">ID</th>
                <th className="text-left py-3 px-2">Event</th>
                <th className="text-left py-3 px-2">Selection</th>
                <th className="text-right py-3 px-2">Odds</th>
                <th className="text-right py-3 px-2">Stake</th>
                <th className="text-center py-3 px-2">Status</th>
                <th className="text-right py-3 px-2">P&L</th>
              </tr>
            </thead>
            <tbody>
              {bets.map(bet => (
                <tr key={bet.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--surface)]">
                  <td className="py-3 px-2 font-mono text-xs text-[var(--muted)]">{bet.id}</td>
                  <td className="py-3 px-2">{bet.event}</td>
                  <td className="py-3 px-2 text-[var(--muted)]">{bet.selection}</td>
                  <td className="py-3 px-2 text-right">{bet.odds.toFixed(2)}</td>
                  <td className="py-3 px-2 text-right">RON {bet.stake.toFixed(2)}</td>
                  <td className="py-3 px-2 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      bet.status === 'WON' ? 'bg-[var(--won)]/20 text-[var(--won)]' :
                      bet.status === 'LOST' ? 'bg-[var(--lost)]/20 text-[var(--lost)]' :
                      bet.status === 'OPEN' ? 'bg-[var(--open)]/20 text-[var(--open)]' :
                      'bg-[var(--muted)]/20 text-[var(--muted)]'
                    }`}>
                      {bet.status}
                    </span>
                  </td>
                  <td className={`py-3 px-2 text-right ${
                    bet.pnl === null ? 'text-[var(--muted)]' :
                    bet.pnl >= 0 ? 'text-[var(--won)]' : 'text-[var(--lost)]'
                  }`}>
                    {bet.pnl !== null ? `RON ${bet.pnl >= 0 ? '+' : ''}${bet.pnl.toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {bets.map(bet => (
            <BetCard key={bet.id} bet={bet} bankroll={10} />
          ))}
        </div>
      )}
    </div>
  )
}