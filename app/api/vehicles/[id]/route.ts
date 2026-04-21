import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError } from '@/lib/api'

const seatLayoutSchema = z
  .object({
    rows: z.number().int().min(1).max(30),
    cols: z.number().int().min(2).max(6),
    aisleAfterCol: z.number().int().min(0).max(6),
    vipRows: z.array(z.number().int().min(1)),
    disabledCells: z.array(z.string()),
    label: z.string().min(1),
    vipMultiplier: z.number().min(1).max(3),
  })
  .nullable()

const updateSchema = z.object({
  plate: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  capacity: z.number().int().positive().optional(),
  amenities: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  seatLayout: seatLayoutSchema.optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const { id } = await params
    const body = updateSchema.parse(await req.json())
    const { seatLayout, ...rest } = body
    const data: Record<string, unknown> = { ...rest }
    if (seatLayout !== undefined) {
      data.seatLayout = seatLayout === null ? null : (seatLayout as unknown as object)
    }
    const vehicle = await prisma.vehicle.update({ where: { id }, data })
    return NextResponse.json({ data: vehicle })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const { id } = await params
    await prisma.vehicle.update({ where: { id }, data: { status: 'INACTIVE' } })
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    return handleError(err)
  }
}
