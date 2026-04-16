import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../../lib/auth';
import { db } from '../../../../lib/db';

export async function GET(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Refresh user data from DB to get latest role/agencyId
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, agencyId: true, stationId: true, avatar: true },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error('[me]', err);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
