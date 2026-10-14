import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { assertOwnsCompany } from '@/lib/scoping'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  const routes = await prisma.route.findMany({
    where: companyId ? { companyId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 1000,
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

    await assertOwnsCompany(session!, body.companyId)

    const route = await prisma.route.create({
      data: body,
      include: {
        originCity: { select: { id: true, name: true } },
        destinationCity: { select: { id: true, name: true } },
      },
    })
    await logAudit(
      { action: 'route.create', entityType: 'Route', entityId: route.id, metadata: { companyId: route.companyId } },
      { session, req },
    )
    return NextResponse.json({ data: route }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
