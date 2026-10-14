import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError } from '@/lib/api'
import { z } from 'zod'
import { logAudit } from '@/lib/audit'

export async function GET() {
  const companies = await prisma.company.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { agencies: true, routes: true } },
    },
  })
  return NextResponse.json({ data: companies })
}

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  logo: z.string().optional(),
  brandColor: z.string().optional(),
  description: z.string().optional(),
  email: z.string().email().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN'])
    const body = createSchema.parse(await req.json())
    const company = await prisma.company.create({ data: body })
    await logAudit(
      { action: 'company.create', entityType: 'Company', entityId: company.id, metadata: { name: company.name } },
      { session, req },
    )
    return NextResponse.json({ data: company }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
