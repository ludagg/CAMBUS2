import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const date = searchParams.get('date')
  const agencyId = searchParams.get('agencyId')

  if (!from || !to || !date) {
    return NextResponse.json(
      { error: 'Paramètres from, to et date requis.' },
      { status: 400 },
    )
  }

  const dateStart = new Date(`${date}T00:00:00`)
  const dateEnd = new Date(`${date}T23:59:59`)

  const departures = await prisma.departure.findMany({
    where: {
      status: 'ACTIVE',
      departureAt: { gte: dateStart, lte: dateEnd },
      route: {
        originCity: { name: from },
        destinationCity: { name: to },
      },
      ...(agencyId ? { agencyId } : {}),
    },
    include: {
      route: {
        include: {
          originCity: { select: { name: true } },
          destinationCity: { select: { name: true } },
          company: { select: { name: true, logo: true, brandColor: true, slug: true } },
        },
      },
      agency: { select: { name: true } },
      originStation: { select: { name: true, address: true, lat: true, lng: true } },
      destStation: { select: { name: true, address: true, lat: true, lng: true } },
    },
    orderBy: { departureAt: 'asc' },
  })

  const mapped = departures.map((d) => {
    const depTime = d.departureAt
    const arrTime = d.arrivalAt
    const durationMin = Math.round((arrTime.getTime() - depTime.getTime()) / 60_000)
    const hours = Math.floor(durationMin / 60)
    const mins = durationMin % 60

    return {
      id: d.id,
      agencyName: d.route.company.name,
      agencyLogo: d.route.company.logo,
      companySlug: d.route.company.slug,
      color: d.route.company.brandColor,
      departureTime: depTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      departureLocation: d.originStation.name,
      departureAddress: d.originStation.address,
      departureLat: d.originStation.lat,
      departureLng: d.originStation.lng,
      arrivalTime: arrTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      arrivalLocation: d.destStation.name,
      arrivalAddress: d.destStation.address,
      arrivalLat: d.destStation.lat,
      arrivalLng: d.destStation.lng,
      duration: `${hours}h ${String(mins).padStart(2, '0')}m`,
      price: d.priceCents,
      currency: d.currency,
      amenities: d.amenities,
      seatsAvailable: d.seatsAvailable,
      seatsTotal: d.seatsTotal,
      date: date,
    }
  })

  return NextResponse.json({ data: mapped })
}
