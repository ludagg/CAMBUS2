import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError } from '@/lib/api'
import { assertOwnsAgency } from '@/lib/scoping'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const agency = await prisma.agency.findUnique({
    where: { id },
    include: {
      company: true,
      city: true,
      stations: true,
      vehicles: true,
      departures: {
        orderBy: { departureAt: 'asc' },
        include: {
          route: { include: { originCity: true, destinationCity: true } },
        },
        take: 50,
      },
    },
  })
  if (!agency) return NextResponse.json({ error: 'Agence introuvable' }, { status: 404 })
  return NextResponse.json({ data: agency })
}

const updateSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  cityId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const { id } = await params
    await assertOwnsAgency(session!, id)
    const body = updateSchema.parse(await req.json())
    const agency = await prisma.agency.update({ where: { id }, data: body })
    return NextResponse.json({ data: agency })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN'])
    const { id } = await params
    await assertOwnsAgency(session!, id)
    await prisma.agency.update({ where: { id }, data: { status: 'INACTIVE' } })
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    return handleError(err)
  }
}
