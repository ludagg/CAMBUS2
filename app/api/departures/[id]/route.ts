import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError } from '@/lib/api'
import { assertOwnsDeparture } from '@/lib/scoping'

const updateSchema = z.object({
  priceCents: z.number().int().positive().optional(),
  seatsTotal: z.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  vehicleId: z.string().nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const { id } = await params
    await assertOwnsDeparture(session!, id)
    const body = updateSchema.parse(await req.json())
    const dep = await prisma.departure.update({ where: { id }, data: body })
    return NextResponse.json({ data: dep })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const { id } = await params
    await assertOwnsDeparture(session!, id)
    await prisma.departure.update({ where: { id }, data: { status: 'INACTIVE' } })
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    return handleError(err)
  }
}
