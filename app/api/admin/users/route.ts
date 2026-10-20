import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSession, hashPassword, requireRole, AuthError } from '@/lib/auth'
import { assertOwnsAgency, getSessionScope } from '@/lib/scoping'
import { bad, handleError } from '@/lib/api'
import { logAudit } from '@/lib/audit'
import { canCreateRole } from '@/lib/team-rules'

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatar: true,
  companyId: true,
  agencyId: true,
  stationId: true,
  createdAt: true,
  company: { select: { name: true } },
  agency: { select: { name: true } },
} satisfies Prisma.UserSelect

export async function GET() {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const s = await getSessionScope(session!)

    let where: Prisma.UserWhereInput = {}
    if (s.role === 'COMPANY_ADMIN') {
      if (!s.companyId) return NextResponse.json({ data: [] })
      where = { companyId: s.companyId, role: { notIn: ['USER', 'SUPER_ADMIN'] } }
    } else if (s.role === 'AGENCY_ADMIN') {
      if (!s.agencyId) return NextResponse.json({ data: [] })
      where = { agencyId: s.agencyId, role: { notIn: ['USER', 'SUPER_ADMIN'] } }
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: userSelect,
    })
    return NextResponse.json({ data: users })
  } catch (err) {
    return handleError(err)
  }
}

const createSchema = z.object({
  name: z.string().trim().min(2, 'Le nom est trop court.').max(120),
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide.'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.').max(200),
  role: z.enum(['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER']),
  companyId: z.string().min(1).optional().nullable(),
  agencyId: z.string().min(1).optional().nullable(),
  stationId: z.string().min(1).optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const body = createSchema.parse(await req.json().catch(() => ({})))

    if (!canCreateRole(session!.role, body.role)) {
      return bad("Vous n'avez pas le droit de créer un compte avec ce rôle.", 403)
    }

    let companyId: string | null = null
    let agencyId: string | null = null
    let stationId: string | null = null

    if (body.role === 'COMPANY_ADMIN') {
      if (!body.companyId) return bad('La compagnie est obligatoire.', 400)
      const company = await prisma.company.findUnique({ where: { id: body.companyId }, select: { id: true } })
      if (!company) return bad('Compagnie introuvable.', 404)
      companyId = company.id
    } else if (body.role === 'AGENCY_ADMIN' || body.role === 'STATION_MANAGER') {
      if (!body.agencyId) return bad("L'agence est obligatoire.", 400)
      const agency = await prisma.agency.findUnique({
        where: { id: body.agencyId },
        select: { id: true, companyId: true },
      })
      if (!agency) return bad('Agence introuvable.', 404)
      await assertOwnsAgency(session!, agency.id)
      agencyId = agency.id
      companyId = agency.companyId
      if (body.role === 'STATION_MANAGER' && body.stationId) {
        const station = await prisma.station.findUnique({
          where: { id: body.stationId },
          select: { id: true, agencyId: true },
        })
        if (!station || station.agencyId !== agency.id) return bad("Cette gare n'appartient pas à l'agence.", 400)
        stationId = station.id
      }
    }

    const existing = await prisma.user.findUnique({ where: { email: body.email }, select: { id: true } })
    if (existing) return bad('Un compte avec cette adresse e-mail existe déjà.', 409)

    const passwordHash = await hashPassword(body.password)
    let user
    try {
      user = await prisma.user.create({
        data: { name: body.name, email: body.email, passwordHash, role: body.role, companyId, agencyId, stationId },
        select: userSelect,
      })
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return bad('Un compte avec cette adresse e-mail existe déjà.', 409)
      }
      throw err
    }

    await logAudit(
      {
        action: 'user.create',
        entityType: 'User',
        entityId: user.id,
        metadata: { email: user.email, name: user.name, role: user.role, companyId, agencyId, stationId },
      },
      { session, req },
    )
    return NextResponse.json({ data: user }, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) return bad(err.message, err.status)
    return handleError(err)
  }
}
