import BetTable from '@/components/BetTable'

export const revalidate = 30

export default function HistoryPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Bet History</h1>
        <p className="text-[var(--muted)] text-sm">
          All bets — filters, sort, view modes
        </p>
      </div>
      <BetTable />
    </div>
  )
}