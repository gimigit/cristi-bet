'use client'

import { BankrollPoint } from '@/lib/types'
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

interface Props {
  data: BankrollPoint[]
}

export default function BankrollChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-8 text-center text-[var(--muted)]">
        No bankroll history yet
      </div>
    )
  }

  const chartData = data.map(d => ({
    date: new Date(d.recorded_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    balance: d.balance,
  }))

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
      <h2 className="text-sm font-medium text-[var(--muted)] mb-4">Bankroll Evolution</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: '#71717a' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: '#71717a' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `RON ${v}`}
            />
            <Tooltip
              contentStyle={{ 
                background: '#18181b', 
                border: '1px solid #27272a',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              labelStyle={{ color: '#71717a' }}
              formatter={(value) => [`RON ${Number(value).toFixed(2)}`, 'Balance']}
            />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke="#a78bfa" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorBalance)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}