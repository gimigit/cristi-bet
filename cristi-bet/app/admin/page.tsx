'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

const ALL_SPORTS = [
  { key: 'soccer_epl',              label: '⚽ Premier League (EPL)' },
  { key: 'soccer_bundesliga',       label: '⚽ Bundesliga' },
  { key: 'soccer_esp-la-liga',      label: '⚽ La Liga' },
  { key: 'soccer_ita-serie_a',      label: '⚽ Serie A' },
  { key: 'soccer_fra-ligue_1',     label: '⚽ Ligue 1' },
  { key: 'basketball_nba',          label: '🏀 NBA' },
  { key: 'basketball_wnba',        label: '🏀 WNBA' },
  { key: 'baseball_mlb',           label: '⚾ MLB' },
  { key: 'icehockey_nhl',          label: '🏒 NHL' },
  { key: 'americanfootball_nfl',   label: '🏈 NFL' },
  { key: 'tennis_atp_major',      label: '🎾 ATP Tennis' },
  { key: 'tennis_wta_major',      label: '🎾 WTA Tennis' },
]

function AdminContent() {
  const params    = useSearchParams()
  const router    = useRouter()
  const adminKey  = params.get('key') ?? ''

  const [active,  setActive]  = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState('')

  useEffect(() => {
    if (!adminKey) router.replace('/')
  }, [adminKey])

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(d => { setActive(d.sports ?? []); setLoading(false) })
      .catch(() => { setLoading(false) })
  }, [])

  function toggle(sport: string) {
    setActive(prev => {
      if (prev.includes(sport)) return prev.filter(s => s !== sport)
      if (prev.length >= 2) {
        setMsg('⚠️ Maximum 2 sporturi (limita free tier The Odds API)')
        return prev
      }
      return [...prev, sport]
    })
    setMsg('')
  }

  async function save() {
    setSaving(true)
    try {
      const r = await fetch(`/api/config?key=${adminKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sports: active })
      })
      const d = await r.json()
      setSaving(false)
      setMsg(d.updated ? '✅ Salvat! Agentul va folosi noile sporturi la următorul scan.' : `❌ Eroare: ${d.error}`)
    } catch (e) {
      setSaving(false)
      setMsg('❌ Eroare de conexiune')
    }
  }

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-[var(--muted)]">Se încarcă...</div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--text)] mb-2">⚙️ CristiBet — Admin</h1>
      <p className="text-[var(--muted)] text-sm mb-8">
        Selectează exact 2 sporturi. Agentul le va folosi la următorul scan automat.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {ALL_SPORTS.map(({ key, label }) => {
          const isOn = active.includes(key)
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`p-4 rounded-lg border text-left transition-all ${
                isOn
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--muted)]'
              }`}
            >
              <span className="block text-sm">{label}</span>
              <span className={`text-xs mt-1 ${isOn ? 'text-[var(--accent)]' : 'text-[var(--border)]'}`}>
                {isOn ? '● ACTIV' : '○ inactiv'}
              </span>
            </button>
          )
        })}
      </div>

      <button
        onClick={save}
        disabled={saving || active.length === 0}
        className="px-6 py-3 bg-[var(--accent)] hover:opacity-90 disabled:opacity-40
                   text-white rounded-lg transition-colors text-sm font-medium"
      >
        {saving ? 'Se salvează...' : 'Salvează configurația'}
      </button>

      {msg && <p className="mt-4 text-sm text-[var(--muted)]">{msg}</p>}

      <div className="mt-12 pt-6 border-t border-[var(--border)] text-xs text-[var(--muted)]">
        <p>Sporturi active: {active.join(', ') || 'niciunul'}</p>
        <p className="mt-1">Requests/zi estimate: {active.length} × 6 scan-uri = {active.length * 6} req/zi</p>
        <p>Monthly: ~{active.length * 6 * 30} / 500 free tier</p>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] p-8">
      <Suspense fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-[var(--muted)]">Se încarcă...</div>
        </div>
      }>
        <AdminContent />
      </Suspense>
    </main>
  )
}