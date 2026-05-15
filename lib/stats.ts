import { Bet, BankrollPoint, Stats, SportStat } from './types'

export function computeStats(bets: Bet[], bankroll: BankrollPoint[]): Stats {
  const startingBankroll = bankroll.length > 0 ? bankroll[0].balance : 10.0
  const settled          = bets.filter(b => b.status !== 'OPEN' && b.status !== 'VOID')
  const wins    = settled.filter(b => b.status === 'WON').length
  const losses  = settled.filter(b => b.status === 'LOST').length
  const open    = bets.filter(b => b.status === 'OPEN').length
  const pnl     = settled.reduce((s, b) => s + (b.pnl ?? 0), 0)
  const current = bankroll.at(-1)?.balance ?? startingBankroll

  // Current streak
  let streak = 0, streakType: 'W' | 'L' | '-' = '-'
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

  // By sport breakdown
  const bySportMap = new Map<string, SportStat>()
  for (const bet of settled) {
    const existing = bySportMap.get(bet.sport) ?? { sport: bet.sport, wins: 0, total: 0, pnl: 0 }
    existing.total++
    if (bet.status === 'WON') existing.wins++
    existing.pnl += bet.pnl ?? 0
    bySportMap.set(bet.sport, existing)
  }

  return {
    bankroll: Math.round(current * 100) / 100,
    startingBankroll: startingBankroll,
    pnl: Math.round(pnl * 100) / 100,
    roi: Math.round((pnl / startingBankroll) * 10000) / 100,
    wins, losses, open,
    winRate: settled.length ? Math.round((wins / settled.length) * 100) : 0,
    totalBets: bets.length,
    currentStreak: streak,
    streakType,
    avgOdds: odds.length
      ? Math.round((odds.reduce((a, b) => a + b, 0) / odds.length) * 100) / 100
      : 0,
    bySport: Array.from(bySportMap.values()),
  }
}

export function formatRon(amount: number): string {
  return `RON ${amount >= 0 ? '+' : ''}${amount.toFixed(2)}`
}

export function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

export function sportLabel(sport: string): string {
  const labels: Record<string, string> = {
    soccer: '⚽ Soccer',
    basketball: '🏀 Basketball',
    americanfootball: '🏈 NFL',
    baseball: '⚾ MLB',
    icehockey: '🏒 Hockey',
    tennis: '🎾 Tennis',
    mma: '🥊 MMA',
    esports: '🎮 Esports',
    horse_racing: '🏇 Horse Racing',
  }
  return labels[sport] ?? sport
}
