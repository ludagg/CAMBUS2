import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'https://easytravel.cm'

export const revalidate = 3600 // 1h

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${publicBaseUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${publicBaseUrl}/agencies`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${publicBaseUrl}/results`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${publicBaseUrl}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${publicBaseUrl}/signup`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  try {
    const routes = await prisma.route.findMany({
      select: {
        originCity: { select: { name: true } },
        destinationCity: { select: { name: true } },
        createdAt: true,
      },
      take: 200,
    })
    const slug = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

    const routeEntries: MetadataRoute.Sitemap = routes.map((r) => ({
      url: `${publicBaseUrl}/results?from=${encodeURIComponent(r.originCity.name)}&to=${encodeURIComponent(r.destinationCity.name)}&slug=${slug(r.originCity.name)}-${slug(r.destinationCity.name)}`,
      lastModified: r.createdAt,
      changeFrequency: 'daily',
      priority: 0.6,
    }))

    return [...staticRoutes, ...routeEntries]
  } catch (err) {
    console.error('[sitemap] failed to fetch routes:', err)
    return staticRoutes
  }
}
