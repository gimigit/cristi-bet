'use client'

import { useEffect, useState } from 'react'

interface CronJob {
  id: string
  name: string
  schedule: string
  schedule_kind: string
  schedule_expr: string | null
  state: string
  enabled: boolean
  last_run_at: string | null
  last_status: string | null
  last_error: string | null
  last_output: string | null
  next_run_at: string | null
  run_count: number
  deliver: string
  source: string
  updated_at: string
}

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'supabase' | 'local'>('supabase')

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cron-jobs')
      const data = await res.json()
      setJobs(data)
      setSource(data.length > 0 && data[0].hasOwnProperty('source') ? 'supabase' : 'local')
    } catch (e) {
      console.error(e)
      setJobs([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchJobs()
    const interval = setInterval(fetchJobs, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatOutput = (text: string | null) => {
    if (!text) return <span className="text-gray-500">(niciun output)</span>
    return (
      <pre className="bg-black/30 p-2 rounded text-green-400 text-xs font-mono whitespace-pre-wrap break-all max-h-40 overflow-auto">
        {text.length > 500 ? text.slice(-500) + '...' : text}
      </pre>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cron Jobs</h1>
      <div className="mb-4">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded bg-gray-800 text-sm">
          <span className={`w-2 h-2 rounded-full ${source === 'supabase' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
          Source: {source}
        </span>
      </div>

      {loading ? (
        <div className="text-gray-400">Se încarcă...</div>
      ) : jobs.length === 0 ? (
        <div className="text-gray-400">Niciun job găsit.</div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-green-400">{job.name}</h2>
                  <p className="text-sm text-gray-400">ID: {job.id}</p>
                  <p className="text-sm text-gray-400">
                    Schedule: {job.schedule} {job.schedule_expr && `(${job.schedule_expr})`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    job.enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {job.enabled ? 'Activ' : 'Oprit'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    job.state === 'active' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {job.state}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                <div>
                  <span className="text-gray-500">Ultima execuție:</span><br />
                  <span className="font-mono">{job.last_run_at ? new Date(job.last_run_at).toLocaleString() : '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Următoarea:</span><br />
                  <span className="font-mono">{job.next_run_at ? new Date(job.next_run_at).toLocaleString() : '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Execuții:</span><br />
                  <span className="font-mono">{job.run_count}</span>
                </div>
                <div>
                  <span className="text-gray-500">Ultimul status:</span><br />
                  <span className={`font-mono ${
                    job.last_status === 'success' ? 'text-green-400' :
                    job.last_status === 'failed' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {job.last_status || '—'}
                  </span>
                </div>
              </div>

              {job.last_error && (
                <div className="mb-3">
                  <span className="text-red-400 text-sm">Eroare:</span>
                  <pre className="bg-red-900/30 text-red-400 text-xs p-2 rounded mt-1 font-mono">
                    {job.last_error}
                  </pre>
                </div>
              )}

              <div>
                <span className="text-gray-400 text-sm">Ultimul output: {job.last_output ? '' : '(niciun output)'}</span>
                {formatOutput(job.last_output)}
              </div>

              <div className="text-gray-500 text-xs mt-2">
                Actualizat: {new Date(job.updated_at).toLocaleString('ro-RO')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
