import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  const routes = await prisma.route.findMany({
    where: companyId ? { companyId } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      originCity: { select: { id: true, name: true } },
      destinationCity: { select: { id: true, name: true } },
      company: { select: { id: true, name: true, brandColor: true } },
      _count: { select: { departures: true } },
    },
  })
  return NextResponse.json({ data: routes })
}

const createSchema = z.object({
  companyId: z.string(),
  originCityId: z.string(),
  destinationCityId: z.string(),
  distanceKm: z.number().int().positive().optional(),
  defaultDurationMin: z.number().int().positive(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN'])
    const body = createSchema.parse(await req.json())
    if (body.originCityId === body.destinationCityId) return bad('Origine et destination identiques.')

    // COMPANY_ADMIN can only create routes for their own company
    if (session!.role === 'COMPANY_ADMIN') {
      const user = await prisma.user.findUnique({ where: { id: session!.sub }, select: { companyId: true } })
      if (!user?.companyId || user.companyId !== body.companyId) return bad('Accès refusé.', 403)
    }

    const route = await prisma.route.create({
      data: body,
      include: {
        originCity: { select: { id: true, name: true } },
        destinationCity: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ data: route }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
