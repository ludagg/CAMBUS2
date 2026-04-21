import type { MetadataRoute } from 'next'

const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://easytravel.cm'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/checkout/',
          '/bookings/',
          '/account/',
          '/login',
          '/signup',
        ],
      },
    ],
    sitemap: `${publicBaseUrl}/sitemap.xml`,
    host: publicBaseUrl,
  }
}
