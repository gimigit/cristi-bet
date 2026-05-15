import { createServerClient } from '@/lib/supabase-server'
import DiaryEntry from '@/components/DiaryEntry'

export const revalidate = 60

export default async function BlogPage() {
  const db = createServerClient()
  const { data: entries } = await db
    .from('diary')
    .select('*')
    .order('date', { ascending: false })
    .limit(30)

  if (!entries || entries.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">📔</div>
        <h1 className="text-2xl font-bold mb-2">The Diary</h1>
        <p className="text-[var(--muted)]">
          Jurnalul zilnic scris de AI — va apărea după primele rezultate.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)] mb-2">The Diary</h1>
        <p className="text-[var(--muted)] text-sm">
          Daily journal written by the AI agent
        </p>
      </div>
      <div className="space-y-6">
        {entries.map(entry => (
          <DiaryEntry key={entry.date} entry={entry} />
        ))}
      </div>
    </div>
  )
}