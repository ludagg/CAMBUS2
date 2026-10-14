import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { assertOwnsIncident } from '@/lib/scoping'
import { logAudit } from '@/lib/audit'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  const session = await getSession()
  requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER'])
  const { id } = await params
  await assertOwnsIncident(session!, id)
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      reportedBy: { select: { id: true, name: true } },
      resolvedBy: { select: { id: true, name: true } },
      departure: true,
      vehicle: true,
      driver: true,
    },
  })
  if (!incident) return bad('Incident introuvable.', 404)
  return NextResponse.json({ data: incident })
  } catch (err) {
    return handleError(err)
  }
}

const updateSchema = z.object({
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  description: z.string().min(3).max(2000).optional(),
  resolve: z.boolean().optional(),
  resolutionNote: z.string().max(2000).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['STATION_MANAGER', 'AGENCY_ADMIN', 'COMPANY_ADMIN', 'SUPER_ADMIN'])
    const { id } = await params
    await assertOwnsIncident(session!, id)
    const body = updateSchema.parse(await req.json())

    const current = await prisma.incident.findUnique({ where: { id } })
    if (!current) return bad('Incident introuvable.', 404)

    const data: {
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
      description?: string
      resolvedAt?: Date | null
      resolvedByUserId?: string | null
      resolutionNote?: string | null
    } = {}
    if (body.severity) data.severity = body.severity
    if (body.description) data.description = body.description
    if (body.resolve === true && !current.resolvedAt) {
      data.resolvedAt = new Date()
      data.resolvedByUserId = session!.sub
      data.resolutionNote = body.resolutionNote ?? null
    } else if (body.resolve === false && current.resolvedAt) {
      data.resolvedAt = null
      data.resolvedByUserId = null
      data.resolutionNote = null
    } else if (body.resolutionNote !== undefined) {
      data.resolutionNote = body.resolutionNote
    }

    const incident = await prisma.incident.update({ where: { id }, data })
    await logAudit(
      {
        action: body.resolve === true ? 'incident.resolve' : 'incident.update',
        entityType: 'Incident',
        entityId: id,
        metadata: { fields: Object.keys(body) },
      },
      { session, req },
    )
    return NextResponse.json({ data: incident })
  } catch (err) {
    return handleError(err)
  }
}
