import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { assertOwnsAgency } from '@/lib/scoping'
import { logAudit } from '@/lib/audit'

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  address: z.string().max(240).nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
})

async function loadStationAgency(id: string) {
  return prisma.station.findUnique({
    where: { id },
    select: { id: true, agencyId: true },
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const { id } = await params
    const station = await loadStationAgency(id)
    if (!station) return bad('Station introuvable.', 404)
    await assertOwnsAgency(session!, station.agencyId)
    const body = updateSchema.parse(await req.json())

    const updated = await prisma.station.update({
      where: { id },
      data: {
        name: body.name,
        address: body.address === null ? null : body.address,
        lat: body.lat === null ? null : body.lat,
        lng: body.lng === null ? null : body.lng,
      },
    })
    await logAudit(
      {
        action: 'station.update',
        entityType: 'Station',
        entityId: id,
        metadata: { fields: Object.keys(body) },
      },
      { session, req },
    )
    return NextResponse.json({ data: updated })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const { id } = await params
    const station = await loadStationAgency(id)
    if (!station) return bad('Station introuvable.', 404)
    await assertOwnsAgency(session!, station.agencyId)

    const futureDepartures = await prisma.departure.count({
      where: {
        OR: [{ originStationId: id }, { destStationId: id }],
        departureAt: { gt: new Date() },
        tripStatus: { notIn: ['CANCELLED', 'COMPLETED'] },
      },
    })
    if (futureDepartures > 0) {
      return bad(
        `Impossible de supprimer cette station: ${futureDepartures} départ(s) à venir l'utilisent comme origine ou destination.`,
        409,
      )
    }

    await prisma.station.delete({ where: { id } })
    await logAudit(
      { action: 'station.delete', entityType: 'Station', entityId: id },
      { session, req },
    )
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    return handleError(err)
  }
}
