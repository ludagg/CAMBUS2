import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

// PATCH /api/users/[id] — Update role, agencyId, etc.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();

    const updateData: Record<string, any> = {};
    if (data.role) updateData.role = data.role;
    if (data.agencyId !== undefined) updateData.agencyId = data.agencyId;
    if (data.stationId !== undefined) updateData.stationId = data.stationId;

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, agencyId: true, stationId: true, avatar: true },
    });

    return NextResponse.json({ user });
  } catch (err) {
    console.error('[users PATCH]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
