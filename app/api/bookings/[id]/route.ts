import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getUserFromRequest } from '../../../../lib/auth';

// GET /api/bookings/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const booking = await db.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: 'Réservation introuvable.' }, { status: 404 });
    }
    return NextResponse.json({ booking });
  } catch (err) {
    console.error('[bookings/id GET]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}

// PATCH /api/bookings/[id] — Update booking status (e.g., BOARDED)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    const validStatuses = ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'BOARDED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Statut invalide.' }, { status: 400 });
    }

    const booking = await db.booking.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ booking });
  } catch (err) {
    console.error('[bookings/id PATCH]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
