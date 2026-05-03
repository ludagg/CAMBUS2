import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole, hashPassword } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { logAudit } from '@/lib/audit'

export async function GET() {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN'])

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        companyId: true,
        agencyId: true,
        stationId: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ data: users })
  } catch (err) {
    return handleError(err)
  }
}

const createSchema = z.object({
  email: z.string().email().max(160),
  name: z.string().min(2).max(120),
  password: z.string().min(8).max(120),
  role: z.enum(['COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER']),
  companyId: z.string().nullable().optional(),
  agencyId: z.string().nullable().optional(),
  stationId: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN'])
    const body = createSchema.parse(await req.json())

    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) return bad('Un utilisateur avec cet email existe déjà.', 409)

    const passwordHash = await hashPassword(body.password)
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash,
        role: body.role,
        companyId: body.companyId ?? null,
        agencyId: body.agencyId ?? null,
        stationId: body.stationId ?? null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        agencyId: true,
        stationId: true,
        createdAt: true,
      },
    })
    await logAudit(
      {
        action: 'user.create',
        entityType: 'User',
        entityId: user.id,
        metadata: { role: body.role, email: body.email },
      },
      { session, req },
    )
    return NextResponse.json({ data: user }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
