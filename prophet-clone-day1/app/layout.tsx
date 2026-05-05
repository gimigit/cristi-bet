import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'ProphetAI — AI Sports Betting Agent',
  description:
    'An autonomous AI agent that scans live odds and places simulated bets. All picks are AI-generated. No real money is wagered.',
  openGraph: {
    title: 'ProphetAI — AI Sports Betting Agent',
    description: 'Autonomous AI sports betting — fully simulated, fully transparent.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
        {/* Navbar */}
        <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-zinc-950/90 backdrop-blur-sm z-50">
          <Link href="/" className="text-zinc-100 font-bold tracking-tight hover:text-violet-400 transition-colors">
            ProphetAI <span className="text-violet-400">∿</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-zinc-400">
            <Link href="/" className="hover:text-zinc-100 transition-colors">
              Dashboard
            </Link>
            <Link href="/history" className="hover:text-zinc-100 transition-colors">
              History
            </Link>
            <Link href="/#faq" className="hover:text-zinc-100 transition-colors">
              FAQ
            </Link>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              live
            </span>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-800 px-6 py-6 mt-16">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-zinc-600">
              ProphetAI <span className="text-violet-400">∿</span> — built as a portfolio experiment
            </p>
            <p className="text-xs text-zinc-600 max-w-md text-right">
              ⚠️ All picks are AI-generated and entirely simulated.
              No real money is wagered. For educational purposes only.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
