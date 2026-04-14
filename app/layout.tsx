import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '../contexts/LanguageContext'
import { NavigationProvider } from '../contexts/NavigationContext'

export const metadata: Metadata = {
  title: 'EasyTravel - Book Your Trip',
  description: 'Book your bus tickets online with EasyTravel',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossOrigin="" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossOrigin="" defer></script>
      </head>
      <body className="bg-background-light dark:bg-background-dark font-display text-text-main dark:text-white overflow-x-hidden">
        <LanguageProvider>
          <NavigationProvider>
            {children}
          </NavigationProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
