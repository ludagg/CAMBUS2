import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';

// GET /api/users — List all users (super_admin only)
export async function GET() {
  try {
    const users = await db.user.findMany({
      select: { id: true, email: true, name: true, role: true, avatar: true, createdAt: true, agencyId: true, stationId: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ users });
  } catch (err) {
    console.error('[users GET]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
