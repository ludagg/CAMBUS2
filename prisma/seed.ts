import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- CITIES ---
  const cities = [
    { name: 'Douala', region: 'Littoral' },
    { name: 'Yaoundé', region: 'Centre' },
    { name: 'Bafoussam', region: 'Ouest' },
    { name: 'Bamenda', region: 'Nord-Ouest' },
    { name: 'Buea', region: 'Sud-Ouest' },
    { name: 'Garoua', region: 'Nord' },
    { name: 'Ngaoundéré', region: 'Adamaoua' },
    { name: 'Maroua', region: 'Extrême-Nord' },
  ];

  for (const city of cities) {
    await prisma.city.upsert({
      where: { name: city.name },
      update: {},
      create: city,
    });
  }
  console.log(`  ✓ ${cities.length} cities`);

  // --- AGENCIES ---
  const agencyExpress = await prisma.agency.upsert({
    where: { id: 'agency-express' },
    update: {},
    create: {
      id: 'agency-express',
      name: 'Express Voyage',
      logo: 'directions_bus',
      colorHex: '#2563eb',
      contactEmail: 'contact@express.cm',
      status: 'active',
    },
  });

  const agencyGreen = await prisma.agency.upsert({
    where: { id: 'agency-green' },
    update: {},
    create: {
      id: 'agency-green',
      name: 'GreenLines',
      logo: 'eco',
      colorHex: '#16a34a',
      contactEmail: 'contact@greenlines.cm',
      status: 'active',
    },
  });

  const agencyRoyal = await prisma.agency.upsert({
    where: { id: 'agency-royal' },
    update: {},
    create: {
      id: 'agency-royal',
      name: 'Royal Road',
      logo: 'star',
      colorHex: '#9333ea',
      contactEmail: 'contact@royalroad.cm',
      status: 'active',
    },
  });

  console.log('  ✓ 3 agencies');

  // --- STATIONS ---
  await prisma.station.upsert({
    where: { id: 'station-express-dla' },
    update: {},
    create: {
      id: 'station-express-dla',
      agencyId: agencyExpress.id,
      name: 'Gare Centrale Douala',
      city: 'Douala',
      address: 'Bd de la Liberté, Akwa',
      lat: 4.0511,
      lng: 9.7679,
    },
  });

  await prisma.station.upsert({
    where: { id: 'station-express-yde' },
    update: {},
    create: {
      id: 'station-express-yde',
      agencyId: agencyExpress.id,
      name: 'Terminus Yaoundé Mvan',
      city: 'Yaoundé',
      address: 'Mvan, Yaoundé',
      lat: 3.848,
      lng: 11.5021,
    },
  });

  await prisma.station.upsert({
    where: { id: 'station-green-bfm' },
    update: {},
    create: {
      id: 'station-green-bfm',
      agencyId: agencyGreen.id,
      name: 'Green Park Bafoussam',
      city: 'Bafoussam',
      address: 'Centre ville, Bafoussam',
    },
  });

  console.log('  ✓ 3 stations');

  // --- USERS ---
  const superAdminPwd = await bcrypt.hash('Admin123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@easytravel.cm' },
    update: {},
    create: {
      email: 'admin@easytravel.cm',
      name: 'Super Admin',
      password: superAdminPwd,
      role: 'SUPER_ADMIN',
      avatar: 'SA',
    },
  });

  const agencyAdminPwd = await bcrypt.hash('Express123!', 12);
  await prisma.user.upsert({
    where: { email: 'ceo@express.cm' },
    update: {},
    create: {
      email: 'ceo@express.cm',
      name: 'Boss Express',
      password: agencyAdminPwd,
      role: 'AGENCY_ADMIN',
      agencyId: agencyExpress.id,
      avatar: 'BE',
    },
  });

  const stationMgrPwd = await bcrypt.hash('Station123!', 12);
  await prisma.user.upsert({
    where: { email: 'jean.d@express.cm' },
    update: {},
    create: {
      email: 'jean.d@express.cm',
      name: 'Jean Dupont',
      password: stationMgrPwd,
      role: 'STATION_MANAGER',
      agencyId: agencyExpress.id,
      stationId: 'station-express-dla',
      avatar: 'JD',
    },
  });

  const userPwd = await bcrypt.hash('User123!', 12);
  await prisma.user.upsert({
    where: { email: 'user@test.cm' },
    update: {},
    create: {
      email: 'user@test.cm',
      name: 'Test User',
      password: userPwd,
      role: 'USER',
      avatar: 'US',
    },
  });

  console.log('  ✓ 4 users (super_admin, agency_admin, station_manager, user)');

  // --- TRIPS (today + next 7 days) ---
  const today = new Date();
  const tripDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const routes = [
    { origin: 'Douala', destination: 'Yaoundé', price: 4500, duration: '4h30' },
    { origin: 'Yaoundé', destination: 'Douala', price: 4500, duration: '4h30' },
    { origin: 'Douala', destination: 'Bafoussam', price: 6000, duration: '6h' },
    { origin: 'Yaoundé', destination: 'Bafoussam', price: 3500, duration: '3h' },
    { origin: 'Douala', destination: 'Bamenda', price: 7500, duration: '8h' },
  ];

  const schedules = [
    { dep: '06:00', arr: '10:30' },
    { dep: '08:00', arr: '12:30' },
    { dep: '10:00', arr: '14:30' },
    { dep: '14:00', arr: '18:30' },
  ];

  const agencyConfigs = [
    { agency: agencyExpress, color: '#2563eb', amenities: ['wifi', 'ac', 'toilet'] },
    { agency: agencyGreen, color: '#16a34a', amenities: ['wifi', 'ac'] },
    { agency: agencyRoyal, color: '#9333ea', amenities: ['ac'] },
  ];

  let tripCount = 0;
  for (const date of tripDates) {
    for (const route of routes) {
      for (const agCfg of agencyConfigs) {
        for (const sched of schedules.slice(0, 2)) {
          const tripId = `trip-${agCfg.agency.id}-${route.origin.slice(0, 3)}-${route.destination.slice(0, 3)}-${date}-${sched.dep.replace(':', '')}`;
          await prisma.trip.upsert({
            where: { id: tripId },
            update: {},
            create: {
              id: tripId,
              agencyId: agCfg.agency.id,
              agencyName: agCfg.agency.name,
              agencyLogo: agCfg.agency.logo || 'directions_bus',
              agencyColor: agCfg.color,
              origin: route.origin,
              destination: route.destination,
              departureTime: sched.dep,
              arrivalTime: sched.arr,
              duration: route.duration,
              date,
              price: route.price,
              currency: 'FCFA',
              totalSeats: 70,
              seatsAvailable: 70,
              amenities: agCfg.amenities,
            },
          });
          tripCount++;
        }
      }
    }
  }

  console.log(`  ✓ ${tripCount} trips created`);
  console.log('\n✅ Seed completed!');
  console.log('\n📋 Demo accounts:');
  console.log('  Super Admin:      admin@easytravel.cm  / Admin123!');
  console.log('  Agency Admin:     ceo@express.cm       / Express123!');
  console.log('  Station Manager:  jean.d@express.cm    / Station123!');
  console.log('  User:             user@test.cm          / User123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
