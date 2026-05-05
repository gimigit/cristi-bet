import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const revalidate = 0

export async function GET(req: Request) {
  const db = createServerClient()
  const { data } = await db
    .from('diary')
    .select('*')
    .order('date', { ascending: false })
    .limit(30)

  return NextResponse.json(data ?? [])
}
