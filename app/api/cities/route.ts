import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { logAudit } from '@/lib/audit'

export async function GET() {
  const cities = await prisma.city.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, region: true, lat: true, lng: true },
  })
  return NextResponse.json({ data: cities })
}

const createSchema = z.object({
  name: z.string().min(2).max(120),
  region: z.string().min(1).max(120),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN'])
    const body = createSchema.parse(await req.json())

    const exists = await prisma.city.findUnique({ where: { name: body.name } })
    if (exists) return bad('Une ville avec ce nom existe déjà.', 409)

    const city = await prisma.city.create({
      data: {
        name: body.name,
        region: body.region,
        lat: body.lat,
        lng: body.lng,
      },
    })
    await logAudit(
      {
        action: 'city.create',
        entityType: 'City',
        entityId: city.id,
        metadata: { name: city.name, region: city.region },
      },
      { session, req },
    )
    return NextResponse.json({ data: city }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
