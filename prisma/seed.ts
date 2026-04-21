import { PrismaClient, Role, Status } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { defaultLayoutForCapacity } from '../lib/seat-layout'

const prisma = new PrismaClient()

const CITIES = [
  { name: 'Douala', region: 'Littoral', lat: 4.0511, lng: 9.7679 },
  { name: 'Yaoundé', region: 'Centre', lat: 3.848, lng: 11.5021 },
  { name: 'Bafoussam', region: 'Ouest', lat: 5.4737, lng: 10.4179 },
  { name: 'Bamenda', region: 'Nord-Ouest', lat: 5.9597, lng: 10.1463 },
  { name: 'Kribi', region: 'Sud', lat: 2.9404, lng: 9.9076 },
  { name: 'Garoua', region: 'Nord', lat: 9.3017, lng: 13.3921 },
  { name: 'Maroua', region: 'Extrême-Nord', lat: 10.591, lng: 14.3158 },
  { name: 'Ngaoundéré', region: 'Adamaoua', lat: 7.3268, lng: 13.5842 },
]

const COMPANIES = [
  {
    slug: 'express-voyage',
    name: 'Express Voyage',
    logo: 'directions_bus',
    brandColor: '#2563eb',
    description: 'Le spécialiste du transport interurbain au Cameroun.',
  },
  {
    slug: 'greenlines',
    name: 'GreenLines',
    logo: 'eco',
    brandColor: '#16a34a',
    description: 'Voyagez éco-responsable avec nos bus hybrides.',
  },
  {
    slug: 'royal-road',
    name: 'Royal Road',
    logo: 'diamond',
    brandColor: '#d97706',
    description: 'Confort premium et service VIP sur les grands axes.',
  },
  {
    slug: 'citylink',
    name: 'CityLink',
    logo: 'apartment',
    brandColor: '#9333ea',
    description: 'Connecte toutes les villes du pays, 7j/7.',
  },
]

// Routes (originCity -> destinationCity), both directions are created automatically
const ROUTE_PAIRS: Array<[string, string, number, number]> = [
  // origin, destination, distanceKm, defaultDurationMin
  ['Douala', 'Yaoundé', 260, 240],
  ['Douala', 'Bafoussam', 300, 300],
  ['Yaoundé', 'Bafoussam', 310, 300],
  ['Douala', 'Kribi', 165, 180],
  ['Yaoundé', 'Bamenda', 370, 420],
  ['Douala', 'Bamenda', 420, 450],
  ['Yaoundé', 'Ngaoundéré', 635, 600],
]

// Agencies per company (cityName -> street-style name)
const AGENCY_CONFIG: Record<string, Array<{ city: string; name: string; address: string }>> = {
  'express-voyage': [
    { city: 'Douala', name: 'Gare Centrale Bonanjo', address: 'Bd de la Liberté, Douala' },
    { city: 'Yaoundé', name: 'Terminal Mvan', address: 'Mvan, Yaoundé' },
    { city: 'Bafoussam', name: 'Agence Marché A', address: 'Av. du 20 Mai, Bafoussam' },
  ],
  greenlines: [
    { city: 'Douala', name: 'Akwa Nord', address: 'Rue Joffre, Akwa, Douala' },
    { city: 'Yaoundé', name: 'Biyem-Assi', address: 'Biyem-Assi, Yaoundé' },
    { city: 'Bamenda', name: 'Commercial Avenue', address: 'Commercial Ave, Bamenda' },
  ],
  'royal-road': [
    { city: 'Douala', name: 'Bonabéri Terminal', address: 'Bonabéri, Douala' },
    { city: 'Yaoundé', name: 'Poste Centrale', address: 'Place de la Poste, Yaoundé' },
    { city: 'Kribi', name: 'Kribi Beach', address: 'Front de mer, Kribi' },
  ],
  citylink: [
    { city: 'Douala', name: 'Agence Bali', address: 'Bali, Douala' },
    { city: 'Yaoundé', name: 'Nsam Terminal', address: 'Nsam, Yaoundé' },
    { city: 'Ngaoundéré', name: 'Centre Ville', address: 'Centre, Ngaoundéré' },
  ],
}

const VEHICLE_MODELS = [
  { model: 'Mercedes Tourismo', capacity: 55, amenities: ['wifi', 'ac', 'power'] },
  { model: 'Scania Touring', capacity: 50, amenities: ['ac', 'snack', 'tv'] },
  { model: 'Volvo 9700', capacity: 45, amenities: ['wifi', 'ac', 'power', 'tv'] },
  { model: 'Iveco Crossway', capacity: 60, amenities: ['ac', 'power'] },
]

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000)
}

function atHour(day: Date, hours: number, minutes = 0) {
  const d = new Date(day)
  d.setHours(hours, minutes, 0, 0)
  return d
}

async function main() {
  console.log('🌱 Seeding Easy Travel database...')

  // Clean slate (order matters because of FKs)
  await prisma.passenger.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.bookingGroup.deleteMany()
  await prisma.departure.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.station.deleteMany()
  await prisma.route.deleteMany()
  await prisma.agency.deleteMany()
  await prisma.user.deleteMany()
  await prisma.company.deleteMany()
  await prisma.city.deleteMany()

  // Cities
  const citiesByName = new Map<string, string>()
  for (const c of CITIES) {
    const created = await prisma.city.create({ data: { ...c, status: Status.ACTIVE } })
    citiesByName.set(created.name, created.id)
  }
  console.log(`  ✓ ${CITIES.length} villes`)

  // Companies + agencies + stations + vehicles
  const companyByslug = new Map<string, string>()
  for (const comp of COMPANIES) {
    const company = await prisma.company.create({
      data: {
        slug: comp.slug,
        name: comp.name,
        logo: comp.logo,
        brandColor: comp.brandColor,
        description: comp.description,
        email: `contact@${comp.slug}.cm`,
        status: Status.ACTIVE,
      },
    })
    companyByslug.set(comp.slug, company.id)

    const agencies = AGENCY_CONFIG[comp.slug]
    for (const ag of agencies) {
      const cityId = citiesByName.get(ag.city)!
      const agency = await prisma.agency.create({
        data: {
          companyId: company.id,
          cityId,
          name: ag.name,
          address: ag.address,
          phone: '+237 6 ' + Math.floor(10000000 + Math.random() * 89999999),
          email: `${ag.city.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}@${comp.slug}.cm`,
          status: Status.ACTIVE,
        },
      })

      // One station per agency (at the agency address)
      await prisma.station.create({
        data: {
          agencyId: agency.id,
          cityId,
          name: `${comp.name} — ${ag.city} ${ag.name}`,
          address: ag.address,
        },
      })

      // 2 vehicles per agency
      for (let i = 0; i < 2; i++) {
        const vm = VEHICLE_MODELS[(i + agencies.indexOf(ag)) % VEHICLE_MODELS.length]
        const variant: 'VIP' | 'CLASSIC' = i === 0 ? 'VIP' : 'CLASSIC'
        await prisma.vehicle.create({
          data: {
            agencyId: agency.id,
            plate: `${comp.slug.slice(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 8999)}`,
            model: vm.model,
            capacity: vm.capacity,
            amenities: vm.amenities,
            seatLayout: defaultLayoutForCapacity(vm.capacity, variant) as unknown as object,
          },
        })
      }
    }
  }
  console.log(`  ✓ ${COMPANIES.length} compagnies + agences + stations + véhicules`)

  // Routes per company
  for (const comp of COMPANIES) {
    const companyId = companyByslug.get(comp.slug)!
    for (const [from, to, km, dur] of ROUTE_PAIRS) {
      const o = citiesByName.get(from)!
      const d = citiesByName.get(to)!
      await prisma.route.upsert({
        where: { companyId_originCityId_destinationCityId: { companyId, originCityId: o, destinationCityId: d } },
        update: {},
        create: { companyId, originCityId: o, destinationCityId: d, distanceKm: km, defaultDurationMin: dur },
      })
      await prisma.route.upsert({
        where: { companyId_originCityId_destinationCityId: { companyId, originCityId: d, destinationCityId: o } },
        update: {},
        create: { companyId, originCityId: d, destinationCityId: o, distanceKm: km, defaultDurationMin: dur },
      })
    }
  }
  const routeCount = await prisma.route.count()
  console.log(`  ✓ ${routeCount} routes`)

  // Departures: for each route, 3 departures per day for the next 7 days
  const DEP_TIMES = [
    { h: 6, m: 30 },
    { h: 10, m: 0 },
    { h: 14, m: 30 },
    { h: 18, m: 0 },
  ]
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const routes = await prisma.route.findMany({
    include: { company: { include: { agencies: { include: { stations: true, vehicles: true } } } } },
  })

  let depCount = 0
  for (const route of routes) {
    // Pick one agency of the company in the origin city (for origin station)
    const originAgency = route.company.agencies.find((a) => a.cityId === route.originCityId)
    const destAgency = route.company.agencies.find((a) => a.cityId === route.destinationCityId)
    if (!originAgency || !destAgency) continue
    const originStation = originAgency.stations[0]
    const destStation = destAgency.stations[0]
    if (!originStation || !destStation) continue

    const basePrice =
      (route.distanceKm ?? 200) * 15 + (route.company.slug === 'royal-road' ? 1500 : 0)

    for (let day = 0; day < 7; day++) {
      const date = new Date(today)
      date.setDate(today.getDate() + day)
      // Use 2-3 departures per day, varying start times
      const times = DEP_TIMES.slice(0, 3 + ((day + route.originCityId.length) % 2))
      for (let idx = 0; idx < times.length; idx++) {
        const t = times[idx]
        const vehicle = originAgency.vehicles[idx % originAgency.vehicles.length]
        const departureAt = atHour(date, t.h, t.m)
        const arrivalAt = addMinutes(departureAt, route.defaultDurationMin)
        const priceCents = Math.round(basePrice + idx * 500)
        const capacity = vehicle?.capacity ?? 50
        await prisma.departure.create({
          data: {
            routeId: route.id,
            agencyId: originAgency.id,
            vehicleId: vehicle?.id,
            originStationId: originStation.id,
            destStationId: destStation.id,
            departureAt,
            arrivalAt,
            priceCents,
            currency: 'XAF',
            amenities: vehicle?.amenities ?? ['ac'],
            seatsTotal: capacity,
            seatsAvailable: capacity,
            status: Status.ACTIVE,
          },
        })
        depCount++
      }
    }
  }
  console.log(`  ✓ ${depCount} départs sur 7 jours`)

  // Users
  const hash = (pwd: string) => bcrypt.hash(pwd, 10)
  const firstCompany = await prisma.company.findFirst()
  const firstAgency = await prisma.agency.findFirst({ where: { companyId: firstCompany?.id } })
  const firstStation = await prisma.station.findFirst({ where: { agencyId: firstAgency?.id } })

  await prisma.user.createMany({
    data: [
      {
        email: 'admin@easytravel.cm',
        passwordHash: await hash('admin123'),
        name: 'Super Admin',
        role: Role.SUPER_ADMIN,
        avatar: 'SA',
      },
      {
        email: 'company@express.cm',
        passwordHash: await hash('company123'),
        name: 'Express Voyage Manager',
        role: Role.COMPANY_ADMIN,
        companyId: firstCompany?.id,
        avatar: 'CO',
      },
      {
        email: 'agency@express.cm',
        passwordHash: await hash('agency123'),
        name: 'Agence Bonanjo',
        role: Role.AGENCY_ADMIN,
        companyId: firstCompany?.id,
        agencyId: firstAgency?.id,
        avatar: 'AG',
      },
      {
        email: 'station@express.cm',
        passwordHash: await hash('station123'),
        name: 'Chef de station',
        role: Role.STATION_MANAGER,
        companyId: firstCompany?.id,
        agencyId: firstAgency?.id,
        stationId: firstStation?.id,
        avatar: 'SM',
      },
      {
        email: 'client@easytravel.cm',
        passwordHash: await hash('client123'),
        name: 'Marie Nguelé',
        role: Role.USER,
        avatar: 'MN',
      },
    ],
  })
  console.log('  ✓ 5 utilisateurs de démo')

  console.log('✅ Seed terminé !')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
