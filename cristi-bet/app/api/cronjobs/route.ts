import { NextResponse } from 'next/server'

export async function GET() {
  // TODO: Implement real cronjob status fetch from Hermes
  // For now, return mock data
  // Real implementation would call Hermes MCP or read from local jobs.json
  
  return NextResponse.json({
    jobs: [
      {
        id: 'f7c17b92a68f',
        name: 'Daily GitHub Trending - AI & Agents',
        last_status: 'ok',
        last_run_at: '2026-05-15T18:03:27+03:00',
        next_run_at: '2026-05-16T18:00:00+03:00',
      },
      {
        id: '9b7618b6be7c',
        name: 'cristi-bet: scan odds',
        last_status: 'ok',
        last_run_at: '2026-05-16T01:45:36+03:00',
        next_run_at: '2026-05-16T04:45:36+03:00',
      },
      {
        id: '70524fd6fa68',
        name: 'cristi-bet: settle bets',
        last_status: 'ok',
        last_run_at: '2026-05-15T22:00:23+03:00',
        next_run_at: '2026-05-16T10:00:00+03:00',
      },
      {
        id: '9a1f2c2315c7',
        name: 'cristi-bet: write daily diary',
        last_status: 'error',
        last_run_at: '2026-05-15T09:21:09+03:00',
        next_run_at: '2026-05-16T09:00:00+03:00',
      },
    ],
  })
}