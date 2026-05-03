import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { computeStats } from '@/lib/stats'

export const revalidate = 0

export async function GET() {
  const db = createServerClient()
  const [betsRes, bankrollRes] = await Promise.all([
    db.from('bets').select('*').order('placed_at', { ascending: false }),
    db.from('bankroll_history').select('*').order('recorded_at'),
  ])

  if (betsRes.error || bankrollRes.error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })

  return NextResponse.json({
    stats:    computeStats(betsRes.data ?? [], bankrollRes.data ?? []),
    bankroll: bankrollRes.data ?? [],
  })
}
