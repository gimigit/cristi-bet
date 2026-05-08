'use client'

import { useState } from 'react'

const faqs = [
  {
    q: "What is CristiBet?",
    a: "CristiBet is a simulated sports betting tracker powered by an AI agent. The agent scans live odds from The Odds API and makes autonomous betting decisions on a simulated £10 bankroll."
  },
  {
    q: "Is this real money?",
    a: "No. All bets are simulated. No real money is wagered. The bankroll is for entertainment and tracking purposes only."
  },
  {
    q: "How does the AI agent work?",
    a: "The agent runs locally on macOS via Hermes. Every 3-4 hours, it scans live odds, analyzes matches using AI, and decides whether to place a bet. It uses strict risk management: max 10% of bankroll per bet, max 60% total exposure."
  },
  {
    q: "How often does it bet?",
    a: "The agent scans odds 6 times per day. It often chooses to skip (NO_BET) when there's no value — it's programmed to be patient, not forced to bet."
  },
  {
    q: "Can I track performance over time?",
    a: "Yes! The dashboard shows your bankroll history chart, win rate, ROI, streaks, and performance breakdown by sport."
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-6">
      <h2 className="text-sm font-medium text-[var(--muted)] mb-4">FAQ</h2>
      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-[var(--border)] rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full px-4 py-3 text-left text-sm text-[var(--text)] flex items-center justify-between hover:bg-[var(--border)]/30 transition-colors"
            >
              <span>{faq.q}</span>
              <span className="text-[var(--muted)]">{openIndex === i ? '▲' : '▼'}</span>
            </button>
            {openIndex === i && (
              <div className="px-4 pb-4 text-sm text-[var(--muted)] leading-relaxed">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}