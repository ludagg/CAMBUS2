import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getUserFromRequest } from '../../../../lib/auth';

// PATCH /api/trips/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    const updateData: Record<string, any> = {};
    const fields = ['origin', 'destination', 'departureTime', 'arrivalTime', 'duration', 'date', 'price', 'totalSeats', 'amenities', 'status', 'agencyName', 'agencyColor'];
    for (const field of fields) {
      if (data[field] !== undefined) {
        updateData[field] = field === 'price' || field === 'totalSeats' ? Number(data[field]) : data[field];
      }
    }

    const trip = await db.trip.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ trip });
  } catch (err) {
    console.error('[trips/id PATCH]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}

// DELETE /api/trips/[id] — Cancel (soft-delete by marking CANCELLED)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const { id } = await params;
    await db.trip.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[trips/id DELETE]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
