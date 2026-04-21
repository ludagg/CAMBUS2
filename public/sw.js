/* Easy Travel — service worker */
/* eslint-disable no-restricted-globals */

const VERSION = 'et-v1'
const STATIC_CACHE = `${VERSION}-static`
const RUNTIME_CACHE = `${VERSION}-runtime`
const API_CACHE = `${VERSION}-api`

const PRECACHE_URLS = [
  '/',
  '/bookings',
  '/offline',
  '/manifest.webmanifest',
  '/favicon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { credentials: 'same-origin' })).catch(() => null),
        ),
      ),
    ),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, RUNTIME_CACHE, API_CACHE].includes(k))
          .map((k) => caches.delete(k)),
      ),
    ),
  )
  self.clients.claim()
})

function isHtmlNavigation(req) {
  return req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'))
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/favicon') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg')
  )
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Never cache sensitive auth/session mutations
  if (url.pathname.startsWith('/api/auth/')) return

  // Stale-while-revalidate for /api/bookings (enables offline ticket view)
  if (url.pathname === '/api/bookings' || url.pathname.startsWith('/api/bookings?')) {
    event.respondWith(staleWhileRevalidate(req, API_CACHE))
    return
  }

  // Cache-first for static assets
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(req, STATIC_CACHE))
    return
  }

  // Network-first for HTML navigations; fallback to cached shell or /offline
  if (isHtmlNavigation(req)) {
    event.respondWith(networkFirstHtml(req))
    return
  }

  // Default: runtime cache-aside
  event.respondWith(staleWhileRevalidate(req, RUNTIME_CACHE))
})

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(req)
  if (cached) return cached
  try {
    const res = await fetch(req)
    if (res.ok) cache.put(req, res.clone())
    return res
  } catch {
    return cached || Response.error()
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(req)
  const networkPromise = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone())
      return res
    })
    .catch(() => null)
  return cached || (await networkPromise) || Response.error()
}

async function networkFirstHtml(req) {
  try {
    const res = await fetch(req)
    if (res && res.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(req, res.clone())
    }
    return res
  } catch {
    const cached = await caches.match(req)
    if (cached) return cached
    const fallback = await caches.match('/offline')
    if (fallback) return fallback
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
  }
}
