import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export const revalidate = 0

export async function GET() {
  const db = createServerClient()
  
  // Încercăm mai întâi din Supabase
  const { data: supabaseData, error: supabaseError } = await db
    .from('cron_jobs')
    .select('*')
    .order('updated_at', { ascending: false })
  
  if (supabaseError) {
    console.error('Supabase error:', supabaseError)
    // Fallback la fișierul local
    try {
      const fs = await import('fs')
      const path = await import('path')
      const jobsFile = path.join(process.cwd(), '..', '..', '..', '..', '.hermes', 'cron', 'jobs.json')
      if (fs.existsSync(jobsFile)) {
        const content = fs.readFileSync(jobsFile, 'utf8')
        const data = JSON.parse(content)
        const cristiJobs = (data.jobs || []).filter((j: any) => 
          j.name.toLowerCase().includes('cristi-bet') || 
          j.name.toLowerCase().includes('cron')
        )
        return NextResponse.json(cristiJobs)
      }
    } catch (e) {
      console.error('Local fallback error:', e)
    }
    return NextResponse.json([])
  }
  
  return NextResponse.json(supabaseData ?? [])
}
