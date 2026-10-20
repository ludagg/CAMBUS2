import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { bad, handleError } from '@/lib/api'
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
  name: z.string().trim().min(2, 'Le nom est trop court.').max(100),
  region: z.string().trim().min(2, 'La région est obligatoire.').max(100),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN'])
    const body = createSchema.parse(await req.json().catch(() => ({})))
    let city
    try {
      city = await prisma.city.create({
        data: { name: body.name, region: body.region, lat: body.lat ?? null, lng: body.lng ?? null },
        select: { id: true, name: true, region: true, lat: true, lng: true },
      })
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return bad('Une ville portant ce nom existe déjà.', 409)
      }
      throw err
    }
    await logAudit(
      { action: 'city.create', entityType: 'City', entityId: city.id, metadata: { name: city.name, region: city.region } },
      { session, req },
    )
    return NextResponse.json({ data: city }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
