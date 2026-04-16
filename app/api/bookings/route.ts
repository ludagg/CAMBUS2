import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getUserFromRequest } from '../../../lib/auth';

// GET /api/bookings — Réservations de l'utilisateur courant
export async function GET(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const bookings = await db.booking.findMany({
      where: { userId: payload.sub },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bookings });
  } catch (err) {
    console.error('[bookings GET]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}

// POST /api/bookings — Créer une réservation (transaction pour éviter les doubles)
export async function POST(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const data = await req.json();
    const {
      tripId, seats, paymentMethod, passengers,
      agencyName, agencyLogo, color,
      from, to, departureTime, date, price, currency,
    } = data;

    if (!tripId || !passengers) {
      return NextResponse.json({ error: 'tripId et passengers sont requis.' }, { status: 400 });
    }

    const booking = await db.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip) throw new Error('Trajet introuvable.');
      if (trip.seatsAvailable < passengers) throw new Error('Plus assez de places disponibles.');

      const requestedSeats: string[] = seats || [];
      const alreadyBooked = requestedSeats.some((s) => trip.seatsBooked.includes(s));
      if (alreadyBooked) throw new Error('Un ou plusieurs sièges sont déjà réservés.');

      // Update trip availability
      await tx.trip.update({
        where: { id: tripId },
        data: {
          seatsAvailable: { decrement: passengers },
          seatsBooked: { push: requestedSeats },
        },
      });

      const qrCodeString = `CB-${tripId.slice(-6).toUpperCase()}-${payload.sub.slice(-6).toUpperCase()}-${Date.now()}`;

      return tx.booking.create({
        data: {
          userId: payload.sub,
          tripId,
          tripDate: date,
          tripRoute: `${from} - ${to}`,
          agencyName: agencyName || trip.agencyName,
          agencyLogo: agencyLogo || trip.agencyLogo,
          color: color || trip.agencyColor,
          from,
          to,
          departureTime,
          date,
          price: Number(price),
          currency: currency || 'FCFA',
          passengers: Number(passengers),
          seats: requestedSeats,
          paymentMethod: paymentMethod || 'momo',
          qrCodeString,
          status: 'CONFIRMED',
        },
      });
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err: any) {
    console.error('[bookings POST]', err);
    const userMessage = ['Trajet introuvable.', 'Plus assez de places disponibles.', 'Un ou plusieurs sièges sont déjà réservés.'].includes(err.message)
      ? err.message
      : 'Erreur lors de la réservation.';
    return NextResponse.json({ error: userMessage }, { status: 400 });
  }
}
