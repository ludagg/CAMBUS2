import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '../../../../lib/db';
import { signToken, setAuthCookie } from '../../../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Tous les champs sont requis.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Cette adresse email est déjà utilisée.' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    // NOTE: Role inference by email is for DEMO PURPOSES ONLY.
    // In production, remove this block and assign roles via the super admin dashboard.
    let role: 'USER' | 'SUPER_ADMIN' | 'AGENCY_ADMIN' | 'STATION_MANAGER' = 'USER';
    let avatar = 'US';
    if (process.env.NODE_ENV !== 'production') {
      if (email.includes('admin')) { role = 'SUPER_ADMIN'; avatar = 'SA'; }
      else if (email.includes('express')) { role = 'AGENCY_ADMIN'; avatar = 'AG'; }
      else if (email.includes('station')) { role = 'STATION_MANAGER'; avatar = 'SM'; }
    }

    const user = await db.user.create({
      data: { name, email, password: hashed, role, avatar },
    });

    const token = await signToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      agencyId: user.agencyId,
      stationId: user.stationId,
      avatar: user.avatar,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      agencyId: user.agencyId,
      stationId: user.stationId,
      avatar: user.avatar,
    }, { status: 201 });
  } catch (err) {
    console.error('[signup]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
