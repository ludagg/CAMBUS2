import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSession, hashPassword, requireRole } from '@/lib/auth'
import { assertOwnsAgency, getSessionScope } from '@/lib/scoping'
import { bad, handleError } from '@/lib/api'
import { logAudit } from '@/lib/audit'
import { checkModify, isInScope, type TeamRole } from '@/lib/team-rules'

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

const patchSchema = z.object({
  name: z.string().trim().min(2, 'Le nom est trop court.').max(120).optional(),
  role: z.enum(['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER']).optional(),
  agencyId: z.string().min(1).nullable().optional(),
  stationId: z.string().min(1).nullable().optional(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.').max(200).optional(),
})

async function loadAndCheck(
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
  id: string,
  newRole: TeamRole | null | undefined,
) {
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, companyId: true, agencyId: true, stationId: true },
  })
  if (!target) return { error: bad('Compte introuvable.', 404) } as const

  const scope = await getSessionScope(session)
  if (!isInScope(session.role, scope, target)) {
    return { error: bad('Accès refusé: ce compte est hors de votre périmètre.', 403) } as const
  }
  const superAdminCount =
    target.role === 'SUPER_ADMIN' ? await prisma.user.count({ where: { role: 'SUPER_ADMIN' } }) : 0
  const verdict = checkModify({
    actorId: session.sub,
    actorRole: session.role,
    targetId: target.id,
    targetRole: target.role,
    newRole,
    superAdminCount,
  })
  if (!verdict.ok) return { error: bad(verdict.message, verdict.status) } as const
  return { target } as const
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const { id } = await params
    const body = patchSchema.parse(await req.json().catch(() => ({})))

    const checked = await loadAndCheck(session!, id, body.role)
    if ('error' in checked) return checked.error
    const { target } = checked

    const finalRole: TeamRole = body.role ?? target.role
    const data: Prisma.UserUncheckedUpdateInput = {}
    if (body.name !== undefined) data.name = body.name
    if (body.password !== undefined) data.passwordHash = await hashPassword(body.password)

    const placementChanges = body.role !== undefined || body.agencyId !== undefined || body.stationId !== undefined
    if (placementChanges) {
      if (finalRole === 'SUPER_ADMIN') {
        data.companyId = null
        data.agencyId = null
        data.stationId = null
      } else if (finalRole === 'COMPANY_ADMIN') {
        if (!target.companyId) return bad("Ce compte n'est rattaché à aucune compagnie.", 400)
        data.agencyId = null
        data.stationId = null
      } else {
        const agencyId = body.agencyId === undefined ? target.agencyId : body.agencyId
        if (!agencyId) return bad("L'agence est obligatoire.", 400)
        const agency = await prisma.agency.findUnique({ where: { id: agencyId }, select: { id: true, companyId: true } })
        if (!agency) return bad('Agence introuvable.', 404)
        await assertOwnsAgency(session!, agency.id)
        data.agencyId = agency.id
        data.companyId = agency.companyId
        let stationId: string | null = body.stationId === undefined ? target.stationId : body.stationId
        if (finalRole !== 'STATION_MANAGER') stationId = null
        if (agency.id !== target.agencyId && body.stationId === undefined) stationId = null
        if (stationId) {
          const station = await prisma.station.findUnique({ where: { id: stationId }, select: { agencyId: true } })
          if (!station || station.agencyId !== agency.id) return bad("Cette gare n'appartient pas à l'agence.", 400)
        }
        data.stationId = stationId
      }
      if (body.role !== undefined) data.role = body.role
    }

    if (Object.keys(data).length === 0) return bad('Aucune modification.', 400)

    const user = await prisma.user.update({ where: { id }, data, select: userSelect })

    await logAudit(
      {
        action: 'user.update',
        entityType: 'User',
        entityId: id,
        metadata: {
          email: target.email,
          changed: {
            name: body.name !== undefined ? { from: target.name, to: body.name } : undefined,
            role: body.role !== undefined && body.role !== target.role ? { from: target.role, to: body.role } : undefined,
            agencyId: data.agencyId !== undefined && data.agencyId !== target.agencyId ? { from: target.agencyId, to: data.agencyId } : undefined,
            stationId: data.stationId !== undefined && data.stationId !== target.stationId ? { from: target.stationId, to: data.stationId } : undefined,
          },
          passwordReset: body.password !== undefined,
        },
      },
      { session, req },
    )
    return NextResponse.json({ data: user })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const { id } = await params

    const checked = await loadAndCheck(session!, id, null)
    if ('error' in checked) return checked.error
    const { target } = checked

    try {
      await prisma.user.delete({ where: { id } })
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        return bad('Ce compte est lié à des réservations ou à un historique: impossible de le supprimer.', 409)
      }
      throw err
    }

    await logAudit(
      {
        action: 'user.delete',
        entityType: 'User',
        entityId: id,
        metadata: { email: target.email, name: target.name, role: target.role },
      },
      { session, req },
    )
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    return handleError(err)
  }
}
