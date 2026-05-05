export type BetStatus  = 'OPEN' | 'WON' | 'LOST' | 'VOID' | 'PUSH'
export type Confidence = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Bet {
  id: string
  event: string
  selection: string
  sport: string
  league: string
  market: string
  event_date: string
  odds: number
  confidence: Confidence
  stake: number
  status: BetStatus
  pnl: number | null
  rationale: string | null
  placed_at: string
  settled_at: string | null
}

export interface BankrollPoint {
  id: number
  balance: number
  recorded_at: string
}

export interface Stats {
  bankroll: number
  startingBankroll: number
  pnl: number
  roi: number
  wins: number
  losses: number
  open: number
  winRate: number
  totalBets: number
  currentStreak: number
  streakType: 'W' | 'L' | '-'
  avgOdds: number
}
