import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page introuvable',
  description: "La page demandée n'existe pas ou a été déplacée.",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center px-6 py-20 bg-background-light dark:bg-background-dark">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-ink-200 dark:border-white/15 px-2.5 py-1 mb-6">
          <span className="size-1.5 rounded-full bg-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            Erreur 404
          </span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tightest text-text-main dark:text-white mb-3">
          Page introuvable
        </h1>
        <p className="text-text-muted dark:text-gray-400 text-sm md:text-base leading-relaxed mb-10">
          La page que vous cherchez n&apos;existe pas ou a été déplacée. Revenez à l&apos;accueil pour continuer votre voyage.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-text-main dark:bg-white text-white dark:text-text-main text-sm font-semibold tracking-tight shadow-subtle hover:shadow-card transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/results"
            className="inline-flex items-center gap-2 px-6 h-11 rounded-full border border-ink-200 dark:border-white/15 text-text-main dark:text-white text-sm font-semibold tracking-tight hover:border-ink-300 dark:hover:border-white/25 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            Rechercher un trajet
          </Link>
        </div>
      </div>
    </main>
  )
}
