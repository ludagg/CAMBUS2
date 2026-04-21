'use client'

import { useEffect } from 'react'

/**
 * Register the PWA service worker on mount.
 *
 * Only runs in production to avoid interfering with Next.js dev HMR.
 * Set NEXT_PUBLIC_PWA_DEV=1 to force registration during local dev.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    const isProd = process.env.NODE_ENV === 'production'
    const force = process.env.NEXT_PUBLIC_PWA_DEV === '1'
    if (!isProd && !force) return

    const onLoad = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((err) => console.warn('[sw] registration failed', err))
    }
    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad, { once: true })
    return () => window.removeEventListener('load', onLoad)
  }, [])

  return null
}
