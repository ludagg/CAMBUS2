import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError } from '@/lib/api'
import { assertOwnsAgency } from '@/lib/scoping'
import { logAudit } from '@/lib/audit'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER'])
    const { id } = await params
    await assertOwnsAgency(session!, id)
    const drivers = await prisma.driver.findMany({
      where: { agencyId: id },
      orderBy: [{ status: 'asc' }, { fullName: 'asc' }],
    })
    return NextResponse.json({ data: drivers })
  } catch (err) {
    return handleError(err)
  }
}

const createSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().max(40).optional(),
  licenseNumber: z.string().min(3).max(40),
  licenseCategory: z.enum(['B', 'C', 'D', 'D1', 'DE']).default('D'),
  licenseExpiresAt: z.string().datetime(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const { id } = await params
    await assertOwnsAgency(session!, id)

    const agency = await prisma.agency.findUnique({
      where: { id },
      select: { companyId: true },
    })
    if (!agency) {
      return NextResponse.json({ error: 'Agence introuvable.' }, { status: 404 })
    }

    const body = createSchema.parse(await req.json())
    const driver = await prisma.driver.create({
      data: {
        agencyId: id,
        companyId: agency.companyId,
        fullName: body.fullName,
        phone: body.phone,
        licenseNumber: body.licenseNumber,
        licenseCategory: body.licenseCategory,
        licenseExpiresAt: new Date(body.licenseExpiresAt),
      },
    })
    await logAudit(
      {
        action: 'driver.create',
        entityType: 'Driver',
        entityId: driver.id,
        metadata: { agencyId: id, licenseNumber: driver.licenseNumber },
      },
      { session, req },
    )
    return NextResponse.json({ data: driver }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
