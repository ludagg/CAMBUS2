import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { assertOwnsAgency } from '@/lib/scoping'
import { logAudit } from '@/lib/audit'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const departures = await prisma.departure.findMany({
    where: { agencyId: id },
    orderBy: { departureAt: 'asc' },
    include: {
      route: {
        include: {
          originCity: { select: { name: true } },
          destinationCity: { select: { name: true } },
        },
      },
      vehicle: { select: { plate: true, model: true, capacity: true } },
    },
    take: 100,
  })
  return NextResponse.json({ data: departures })
}

const createSchema = z.object({
  originCityId: z.string(),
  destinationCityId: z.string(),
  originStationId: z.string(),
  destStationId: z.string(),
  vehicleId: z.string().optional(),
  departureAt: z.string().datetime(),
  durationMin: z.number().int().positive(),
  priceCents: z.number().int().positive(),
  seatsTotal: z.number().int().positive(),
  amenities: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN'])
    const { id } = await params
    await assertOwnsAgency(session!, id)
    const body = createSchema.parse(await req.json())

    const agency = await prisma.agency.findUnique({ where: { id } })
    if (!agency) return bad('Agence introuvable.', 404)

    // Find or create a route
    let route = await prisma.route.findUnique({
      where: {
        companyId_originCityId_destinationCityId: {
          companyId: agency.companyId,
          originCityId: body.originCityId,
          destinationCityId: body.destinationCityId,
        },
      },
    })
    if (!route) {
      route = await prisma.route.create({
        data: {
          companyId: agency.companyId,
          originCityId: body.originCityId,
          destinationCityId: body.destinationCityId,
          defaultDurationMin: body.durationMin,
        },
      })
    }

    const departureAt = new Date(body.departureAt)
    const arrivalAt = new Date(departureAt.getTime() + body.durationMin * 60_000)

    // Referenced resources must belong to this agency / company.
    if (body.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: body.vehicleId },
        select: { agencyId: true, status: true },
      })
      if (!vehicle || vehicle.agencyId !== agency.id) return bad("Véhicule invalide pour cette agence.", 400)
      if (vehicle.status !== 'ACTIVE') return bad('Ce véhicule est désactivé.', 409)
    }
    const [originStation, destStation] = await Promise.all([
      prisma.station.findUnique({ where: { id: body.originStationId }, select: { agencyId: true, agency: { select: { companyId: true } } } }),
      prisma.station.findUnique({ where: { id: body.destStationId }, select: { agencyId: true, agency: { select: { companyId: true } } } }),
    ])
    if (!originStation || originStation.agencyId !== agency.id) return bad("Gare de départ invalide pour cette agence.", 400)
    if (!destStation) return bad("Gare d'arrivée introuvable.", 404)

    if (body.vehicleId) {
      const conflict = await prisma.departure.findFirst({
        where: {
          vehicleId: body.vehicleId,
          status: 'ACTIVE',
          // overlap: existing.departureAt < newArrival AND existing.arrivalAt > newDeparture
          departureAt: { lt: arrivalAt },
          arrivalAt: { gt: departureAt },
        },
        include: { route: { include: { originCity: true, destinationCity: true } } },
      })
      if (conflict) {
        return bad(
          `Ce véhicule est déjà programmé sur ${conflict.route.originCity.name} → ${conflict.route.destinationCity.name} à ${conflict.departureAt.toISOString()}.`,
          409,
        )
      }
    }

    const dep = await prisma.departure.create({
      data: {
        routeId: route.id,
        agencyId: agency.id,
        vehicleId: body.vehicleId,
        originStationId: body.originStationId,
        destStationId: body.destStationId,
        departureAt,
        arrivalAt,
        priceCents: body.priceCents,
        seatsTotal: body.seatsTotal,
        seatsAvailable: body.seatsTotal,
        amenities: body.amenities ?? [],
      },
    })
    await logAudit(
      { action: 'departure.create', entityType: 'Departure', entityId: dep.id, metadata: { agencyId: agency.id, routeId: route.id, priceCents: dep.priceCents, departureAt: dep.departureAt.toISOString() } },
      { session, req },
    )
    return NextResponse.json({ data: dep }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
