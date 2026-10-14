import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { assertOwnsDeparture } from '@/lib/scoping'
import { logAudit } from '@/lib/audit'

const updateSchema = z.object({
  priceCents: z.number().int().positive().optional(),
  seatsTotal: z.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  vehicleId: z.string().nullable().optional(),
  driverId: z.string().nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const { id } = await params
    await assertOwnsDeparture(session!, id)
    const body = updateSchema.parse(await req.json())

    if (body.driverId) {
      const dep = await prisma.departure.findUnique({
        where: { id },
        select: { agencyId: true },
      })
      const driver = await prisma.driver.findUnique({
        where: { id: body.driverId },
        select: { agencyId: true, status: true },
      })
      if (!driver) return bad('Chauffeur introuvable.', 404)
      if (driver.status !== 'ACTIVE')
        return bad('Ce chauffeur est désactivé.', 409)
      if (dep && driver.agencyId !== dep.agencyId)
        return bad("Ce chauffeur n'appartient pas à l'agence du départ.", 400)
    }

    const previous = await prisma.departure.findUnique({
      where: { id },
      select: {
        priceCents: true,
        vehicleId: true,
        driverId: true,
        status: true,
        agencyId: true,
        seatsTotal: true,
        seatsAvailable: true,
      },
    })
    if (!previous) return bad('Départ introuvable.', 404)

    if (body.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: body.vehicleId },
        select: { agencyId: true, status: true },
      })
      if (!vehicle) return bad('Véhicule introuvable.', 404)
      if (vehicle.agencyId !== previous.agencyId)
        return bad("Ce véhicule n'appartient pas à l'agence du départ.", 400)
      if (vehicle.status !== 'ACTIVE') return bad('Ce véhicule est désactivé.', 409)
    }

    if (body.status === 'INACTIVE' && previous.status !== 'INACTIVE') {
      const active = await prisma.booking.count({
        where: { departureId: id, status: { in: ['PENDING', 'CONFIRMED'] } },
      })
      if (active > 0) {
        return bad(`Impossible de désactiver: ${active} réservation(s) active(s). Annulez le départ à la place.`, 409)
      }
    }

    // Keep seatsAvailable consistent with seatsTotal and never drop below sold seats.
    const data: Record<string, unknown> = { ...body }
    if (body.seatsTotal !== undefined) {
      const sold = previous.seatsTotal - previous.seatsAvailable
      if (body.seatsTotal < sold) {
        return bad(`Impossible: ${sold} place(s) déjà vendue(s).`, 409)
      }
      data.seatsAvailable = body.seatsTotal - sold
    }

    const dep = await prisma.departure.update({ where: { id }, data })
    await logAudit(
      {
        action: 'departure.update',
        entityType: 'Departure',
        entityId: id,
        metadata: { fields: Object.keys(body), before: previous, after: body },
      },
      { session, req },
    )
    return NextResponse.json({ data: dep })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const { id } = await params
    await assertOwnsDeparture(session!, id)
    const active = await prisma.booking.count({
      where: { departureId: id, status: { in: ['PENDING', 'CONFIRMED'] } },
    })
    if (active > 0) {
      return bad(`Impossible de supprimer: ${active} réservation(s) active(s). Annulez le départ à la place.`, 409)
    }
    await prisma.departure.update({ where: { id }, data: { status: 'INACTIVE' } })
    await logAudit(
      { action: 'departure.disable', entityType: 'Departure', entityId: id },
      { session, req },
    )
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    return handleError(err)
  }
}
