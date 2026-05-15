import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const revalidate = 0

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const sport  = searchParams.get('sport')
  const limit  = parseInt(searchParams.get('limit') ?? '100')

  const db = createServerClient()
  let q = db.from('bets').select('*').order('placed_at', { ascending: false }).limit(limit)

  if (status && status !== 'ALL') q = q.eq('status', status)
  if (sport  && sport  !== 'ALL') q = q.eq('sport', sport)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
