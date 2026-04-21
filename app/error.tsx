'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app/error]', error)
  }, [error])

  return (
    <main className="min-h-screen w-full flex items-center justify-center px-6 py-20 bg-background-light dark:bg-background-dark">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 px-2.5 py-1 mb-6">
          <span className="size-1.5 rounded-full bg-red-500" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-red-600 dark:text-red-400">
            Erreur inattendue
          </span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tightest text-text-main dark:text-white mb-3">
          Quelque chose s&apos;est mal passé
        </h1>
        <p className="text-text-muted dark:text-gray-400 text-sm md:text-base leading-relaxed mb-8">
          Nos serveurs n&apos;ont pas pu traiter votre requête. Réessayez, ou revenez à l&apos;accueil si le problème persiste.
        </p>
        {error.digest && (
          <p className="text-[11px] text-text-muted font-mono mb-8">
            Référence : {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-text-main dark:bg-white text-white dark:text-text-main text-sm font-semibold tracking-tight shadow-subtle hover:shadow-card transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 h-11 rounded-full border border-ink-200 dark:border-white/15 text-text-main dark:text-white text-sm font-semibold tracking-tight hover:border-ink-300 dark:hover:border-white/25 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Accueil
          </a>
        </div>
      </div>
    </main>
  )
}
