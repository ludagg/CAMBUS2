import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';

// GET /api/trips?origin=X&destination=Y&date=Z&agencyId=A
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');
    const agencyId = searchParams.get('agencyId');

    // Allow filtering by agencyId alone (for agency admin dashboard)
    if (!agencyId && (!origin || !destination || !date)) {
      return NextResponse.json({ error: 'origin, destination et date sont requis (ou agencyId).' }, { status: 400 });
    }

    const where: Record<string, any> = {};
    if (agencyId) where.agencyId = agencyId;
    if (origin) where.origin = origin;
    if (destination) where.destination = destination;
    if (date) where.date = date;
    if (!agencyId) {
      where.status = 'SCHEDULED';
      where.seatsAvailable = { gt: 0 };
    }

    const trips = await db.trip.findMany({
      where,
      orderBy: { departureTime: 'asc' },
    });

    return NextResponse.json({ trips });
  } catch (err) {
    console.error('[trips GET]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}

// POST /api/trips — Créer un trajet (agency_admin uniquement)
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      agencyId, agencyName, agencyLogo, agencyColor,
      origin, destination, departureTime, arrivalTime, duration,
      date, price, currency, totalSeats, amenities,
    } = data;

    if (!agencyId || !origin || !destination || !departureTime || !date || !price) {
      return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 });
    }

    const trip = await db.trip.create({
      data: {
        agencyId,
        agencyName: agencyName || '',
        agencyLogo: agencyLogo || null,
        agencyColor: agencyColor || null,
        origin,
        destination,
        departureTime,
        arrivalTime: arrivalTime || null,
        duration: duration || null,
        date,
        price: Number(price),
        currency: currency || 'FCFA',
        totalSeats: Number(totalSeats) || 70,
        seatsAvailable: Number(totalSeats) || 70,
        amenities: amenities || [],
      },
    });

    return NextResponse.json({ trip }, { status: 201 });
  } catch (err) {
    console.error('[trips POST]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
