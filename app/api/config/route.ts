import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function isAuthorized(req: Request) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')
  return key && (key === process.env.ADMIN_KEY || key === process.env.ACCESS_PASSWORD)
}

// GET — sporturile active
export async function GET() {
  const db = adminClient()
  const { data } = await db
    .from('config')
    .select('value')
    .eq('key', 'active_sports')
    .single()

  return NextResponse.json({ sports: data?.value ?? [] })
}

// POST — actualizează sporturile active
export async function POST(req: Request) {
  if (!isAuthorized(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sports } = await req.json()
  const ALLOWED = [
    'soccer_epl', 'soccer_bundesliga', 'basketball_nba',
    'baseball_mlb', 'icehockey_nhl', 'americanfootball_nfl',
  ]
  const valid = (sports ?? []).filter((s: string) => ALLOWED.includes(s)).slice(0, 2)
  if (valid.length === 0)
    return NextResponse.json({ error: 'No valid sports' }, { status: 400 })

  const db = adminClient()
  await db.from('config').upsert({ key: 'active_sports', value: valid })
  return NextResponse.json({ sports: valid, updated: true })
}
