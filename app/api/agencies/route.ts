import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError } from '@/lib/api'
import { assertOwnsCompany } from '@/lib/scoping'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')

  const agencies = await prisma.agency.findMany({
    where: {
      status: 'ACTIVE',
      ...(companyId ? { companyId } : {}),
    },
    orderBy: { name: 'asc' },
    include: {
      company: { select: { name: true, logo: true, brandColor: true, slug: true } },
      city: { select: { name: true, region: true } },
      _count: { select: { departures: true, vehicles: true } },
    },
  })
  return NextResponse.json({ data: agencies })
}

const createSchema = z.object({
  companyId: z.string(),
  cityId: z.string(),
  name: z.string().min(2),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN'])
    const body = createSchema.parse(await req.json())
    await assertOwnsCompany(session!, body.companyId)
    const agency = await prisma.agency.create({
      data: body,
      include: { company: { select: { name: true } }, city: { select: { name: true } } },
    })
    await logAudit(
      { action: 'agency.create', entityType: 'Agency', entityId: agency.id, metadata: { companyId: agency.companyId, name: agency.name } },
      { session, req },
    )
    return NextResponse.json({ data: agency }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
