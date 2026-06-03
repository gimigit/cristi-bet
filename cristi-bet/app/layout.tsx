import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CristiBet — AI Sports Betting Agent",
  description: "An autonomous AI agent that scans live odds and places simulated bets. All picks are AI-generated. No real money is wagered.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚽</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">
        {/* Nav */}
        <nav className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="text-[var(--accent)]">⚽</span>
            <span>CristiBet</span>
            <span className="text-[var(--muted)] text-xs font-normal">by Hermes AI</span>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/" className="text-[var(--muted)] hover:text-[var(--text)] transition-colors">
              Dashboard
            </Link>
            <Link href="/history" className="text-[var(--muted)] hover:text-[var(--text)] transition-colors">
              History
            </Link>
            <Link href="/scout" className="text-[var(--muted)] hover:text-[var(--text)] transition-colors">
              🕵️ Scout
            </Link>
            <Link href="/blog" className="text-[var(--muted)] hover:text-[var(--text)] transition-colors">
              The Diary
            </Link>
          </div>
        </nav>

        {/* Main */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-[var(--border)] px-6 py-5 text-center text-xs text-[var(--muted)]">
          <p>
            CristiBet is a <strong className="text-[var(--muted)]">simulated betting tracker</strong>.
            No real money is wagered. All picks are AI-generated for entertainment purposes only.
          </p>
          <p className="mt-1 opacity-60">
            Powered by Hermes AI · Built with Next.js + Supabase
          </p>
        </footer>
      </body>
    </html>
  );
}
