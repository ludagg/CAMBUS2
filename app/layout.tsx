import type { Metadata, Viewport } from 'next'
import './globals.css'
import { LanguageProvider } from '../contexts/LanguageContext'
import { NavigationProvider } from '../contexts/NavigationContext'
import ServiceWorkerRegister from '../components/ServiceWorkerRegister'

const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://easytravel.cm'
const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Easy Travel'

export const metadata: Metadata = {
  metadataBase: new URL(publicBaseUrl),
  title: {
    default: `${appName} — Réservez votre billet de bus au Cameroun`,
    template: `%s | ${appName}`,
  },
  description:
    "Réservez en ligne vos billets de bus partout au Cameroun. Comparez les compagnies, choisissez votre siège, payez par Mobile Money et recevez votre billet QR instantanément.",
  applicationName: appName,
  keywords: [
    'billet bus',
    'Cameroun',
    'transport interurbain',
    'Yaoundé',
    'Douala',
    'réservation bus',
    'Mobile Money',
    'MTN MoMo',
    'Orange Money',
    'Easy Travel',
  ],
  authors: [{ name: 'Easy Travel' }],
  category: 'travel',
  openGraph: {
    type: 'website',
    siteName: appName,
    title: `${appName} — Réservez votre billet de bus au Cameroun`,
    description:
      "Comparez toutes les compagnies, choisissez votre siège et payez par Mobile Money. Billet QR instantané.",
    locale: 'fr_CM',
    alternateLocale: ['en_US'],
    url: publicBaseUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${appName} — Réservez votre billet de bus au Cameroun`,
    description:
      "Comparez toutes les compagnies, choisissez votre siège et payez par Mobile Money.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: { canonical: '/' },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/api/pwa/icon-192',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Easy Travel',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1a10' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: appName,
  url: publicBaseUrl,
  logo: `${publicBaseUrl}/favicon.svg`,
  sameAs: [] as string[],
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'CM',
  },
}

const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: appName,
  url: publicBaseUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${publicBaseUrl}/results?from={origin}&to={destination}`,
    'query-input': 'required name=origin required name=destination',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="light" suppressHydrationWarning>
      <head>
        {/* Icons are ligatures ("directions_bus"): hide them until the icon font is
            ready so slow connections never show the raw text. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var d=document.documentElement;function r(){d.classList.add('icons-ready')}try{document.fonts.load('24px \"Material Symbols Outlined\"','search').then(function(f){if(f&&f.length)r()},function(){});document.fonts.ready.then(function(){if(document.fonts.check('24px \"Material Symbols Outlined\"'))r()})}catch(e){r()}})()",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossOrigin="" defer></script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
        />
      </head>
      <body className="bg-background-light dark:bg-background-dark font-sans text-text-main dark:text-white overflow-x-hidden antialiased">
        <LanguageProvider>
          <NavigationProvider>
            {children}
          </NavigationProvider>
        </LanguageProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
