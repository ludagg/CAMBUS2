import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { assertOwnsAgency } from '@/lib/scoping'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cityId = searchParams.get('cityId')
  const agencyId = searchParams.get('agencyId')
  const stations = await prisma.station.findMany({
    where: {
      ...(cityId ? { cityId } : {}),
      ...(agencyId ? { agencyId } : {}),
    },
    orderBy: { name: 'asc' },
    include: {
      city: { select: { id: true, name: true } },
      agency: { select: { id: true, name: true } },
    },
  })
  return NextResponse.json({ data: stations })
}

const createSchema = z.object({
  agencyId: z.string(),
  cityId: z.string(),
  name: z.string().min(2).max(120),
  address: z.string().max(240).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const body = createSchema.parse(await req.json())
    await assertOwnsAgency(session!, body.agencyId)

    const city = await prisma.city.findUnique({ where: { id: body.cityId } })
    if (!city) return bad('Ville introuvable.', 404)

    const station = await prisma.station.create({
      data: {
        agencyId: body.agencyId,
        cityId: body.cityId,
        name: body.name,
        address: body.address,
        lat: body.lat,
        lng: body.lng,
      },
      include: {
        city: { select: { id: true, name: true } },
        agency: { select: { id: true, name: true } },
      },
    })
    await logAudit(
      {
        action: 'station.create',
        entityType: 'Station',
        entityId: station.id,
        metadata: { agencyId: body.agencyId, cityId: body.cityId, name: body.name },
      },
      { session, req },
    )
    return NextResponse.json({ data: station }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
