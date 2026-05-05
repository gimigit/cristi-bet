import { Bet, BankrollPoint, Stats } from './types'

const STARTING_BANKROLL = 10.0

export function computeStats(bets: Bet[], bankroll: BankrollPoint[]): Stats {
  const settled = bets.filter(b => b.status !== 'OPEN' && b.status !== 'VOID')
  const wins    = settled.filter(b => b.status === 'WON').length
  const losses  = settled.filter(b => b.status === 'LOST').length
  const open    = bets.filter(b => b.status === 'OPEN').length
  const pnl     = settled.reduce((s, b) => s + (b.pnl ?? 0), 0)
  const current = bankroll.at(-1)?.balance ?? STARTING_BANKROLL

  // Current streak
  let streak = 0
  let streakType: 'W' | 'L' | '-' = '-'
  const sorted = [...settled].sort(
    (a, b) => new Date(b.settled_at!).getTime() - new Date(a.settled_at!).getTime()
  )
  if (sorted.length > 0) {
    streakType = sorted[0].status === 'WON' ? 'W' : 'L'
    for (const b of sorted) {
      if ((b.status === 'WON') === (streakType === 'W')) streak++
      else break
    }
  }

  const odds = settled.map(b => b.odds)

  return {
    bankroll:        Math.round(current * 100) / 100,
    startingBankroll: STARTING_BANKROLL,
    pnl:             Math.round(pnl * 100) / 100,
    roi:             Math.round((pnl / STARTING_BANKROLL) * 10000) / 100,
    wins,
    losses,
    open,
    winRate:         settled.length ? Math.round((wins / settled.length) * 100) : 0,
    totalBets:       bets.length,
    currentStreak:   streak,
    streakType,
    avgOdds:         odds.length
      ? Math.round((odds.reduce((a, b) => a + b, 0) / odds.length) * 100) / 100
      : 0,
  }
}
