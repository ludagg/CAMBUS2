import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Hors-ligne',
  description: 'Vous êtes hors-ligne. Vos billets restent consultables.',
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center px-6 py-20 bg-background-light dark:bg-background-dark">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-ink-200 dark:border-white/15 px-2.5 py-1 mb-6">
          <span className="size-1.5 rounded-full bg-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            Mode hors-ligne
          </span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tightest text-text-main dark:text-white mb-3">
          Vous êtes hors-ligne
        </h1>
        <p className="text-text-muted dark:text-gray-400 text-sm md:text-base leading-relaxed mb-10">
          Aucun réseau détecté. Vos billets déjà consultés restent accessibles depuis la page « Mes voyages » — le QR code s&apos;affichera normalement.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-text-main dark:bg-white text-white dark:text-text-main text-sm font-semibold tracking-tight shadow-subtle hover:shadow-card transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
            Voir mes billets
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 h-11 rounded-full border border-ink-200 dark:border-white/15 text-text-main dark:text-white text-sm font-semibold tracking-tight hover:border-ink-300 dark:hover:border-white/25 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Accueil
          </Link>
        </div>
      </div>
    </main>
  )
}
