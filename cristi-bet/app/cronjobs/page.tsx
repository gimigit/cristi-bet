'use client'

import { useState, useEffect } from 'react'

const CRONJOBS = [
  {
    id: 'scan_odds',
    name: '⚡ cristi-bet: scan odds',
    schedule: 'every 180m (3h)',
    description: 'Scanează cote live, plasează pariuri cu AI',
    icon: '🎯',
  },
  {
    id: 'settle_bets',
    name: '📊 cristi-bet: settle bets',
    schedule: '10:00, 13:00, 16:00, 22:00',
    description: 'Verifică meciuri terminate, actualizează rezultate',
    icon: '✅',
  },
  {
    id: 'write_diary',
    name: '📝 cristi-bet: write daily diary',
    schedule: '09:00 daily',
    description: 'Generează rezumat narativ al zilei',
    icon: '📖',
  },
  {
    id: 'github_trending',
    name: '🔮 Daily GitHub Trending - AI & Agents',
    schedule: '18:00 daily',
    description: 'Postează trending repos pe Discord',
    icon: '🚀',
  },
]

const STATUS_COLORS: Record<string, string> = {
  ok: 'text-green-400',
  error: 'text-red-400',
  running: 'text-yellow-400',
}

export default function CronjobsPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if already authed in this session
    if (sessionStorage.getItem('cronjobs_auth') === 'true') {
      setAuthed(true)
      fetchJobs()
    } else {
      setLoading(false)
    }
  }, [])

  async function fetchJobs() {
    try {
      const r = await fetch('/api/cronjobs/status')
      if (r.ok) {
        const d = await r.json()
        setJobs(d.jobs ?? [])
      }
    } catch {
      // Silently fail
    }
    setLoading(false)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (password === 'hermes2025') {
      setAuthed(true)
      sessionStorage.setItem('cronjobs_auth', 'true')
      fetchJobs()
    } else {
      setError('Parolă incorectă')
      setPassword('')
    }
  }

  if (!authed) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🤖</div>
            <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Cronjobs Status</h1>
            <p className="text-[var(--muted)] text-sm">Acces restricționat</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Parolă"
                autoFocus
                className="w-full px-4 py-3 bg-[var(--surface)] border border-[var(--border)] 
                           rounded-lg text-[var(--text)] placeholder-[var(--muted)]
                           focus:outline-none focus:border-[var(--accent)]"
              />
              {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[var(--accent)] hover:opacity-90 
                         text-white rounded-lg font-medium transition-opacity"
            >
              Accesează
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text)] mb-2">🤖 Cronjobs Status</h1>
        <p className="text-[var(--muted)]">Agentul rulează automat în background</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--muted)]">Se încarcă...</div>
      ) : (
        <div className="space-y-4">
          {CRONJOBS.map(cron => {
            const job = jobs.find(j => j.name?.toLowerCase().includes(cron.id) || j.name?.toLowerCase().includes(cron.name.toLowerCase()))
            
            return (
              <div
                key={cron.id}
                className="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-xl"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cron.icon}</span>
                    <div>
                      <h3 className="font-medium text-[var(--text)]">{cron.name}</h3>
                      <p className="text-sm text-[var(--muted)]">{cron.schedule}</p>
                    </div>
                  </div>
                  {job && (
                    <span className={`text-xs font-mono ${STATUS_COLORS[job.last_status] ?? 'text-[var(--muted)]'}`}>
                      {job.last_status?.toUpperCase() ?? '—'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--muted)]">{cron.description}</p>
                {job && job.last_run_at && (
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Last run: {new Date(job.last_run_at).toLocaleString('ro-RO')}
                  </p>
                )}
                {job && job.next_run_at && (
                  <p className="text-xs text-[var(--muted)]">
                    Next run: {new Date(job.next_run_at).toLocaleString('ro-RO')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-[var(--border)]">
        <a href="/" className="text-sm text-[var(--accent)] hover:underline">
          ← Înapoi la CristiBet
        </a>
      </div>
    </main>
  )
}