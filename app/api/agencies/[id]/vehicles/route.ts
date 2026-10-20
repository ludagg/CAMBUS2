import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError } from '@/lib/api'
import { assertOwnsAgency } from '@/lib/scoping'
import { logAudit } from '@/lib/audit'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const vehicles = await prisma.vehicle.findMany({
    where: { agencyId: id },
    orderBy: { plate: 'asc' },
  })
  return NextResponse.json({ data: vehicles })
}

const createSchema = z.object({
  plate: z.string().min(1),
  model: z.string().min(1),
  capacity: z.number().int().positive(),
  amenities: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const { id } = await params
    await assertOwnsAgency(session!, id)
    const body = createSchema.parse(await req.json())
    const vehicle = await prisma.vehicle.create({
      data: {
        agencyId: id,
        plate: body.plate,
        model: body.model,
        capacity: body.capacity,
        amenities: body.amenities ?? [],
      },
    })
    await logAudit(
      { action: 'vehicle.create', entityType: 'Vehicle', entityId: vehicle.id, metadata: { agencyId: id, plate: vehicle.plate, capacity: vehicle.capacity } },
      { session, req },
    )
    return NextResponse.json({ data: vehicle }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
