import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getUserFromRequest, signToken, setAuthCookie } from '../../../../lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/users/me — Return current user profile
export async function GET(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, avatar: true, agencyId: true, stationId: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error('[users/me GET]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}

// PATCH /api/users/me — Update current user's name or password
export async function PATCH(req: NextRequest) {
  try {
    const payload = await getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
    }

    const { name, currentPassword, newPassword } = await req.json();

    const updateData: Record<string, any> = {};

    if (name?.trim()) {
      updateData.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Le mot de passe actuel est requis.' }, { status: 400 });
      }

      const existing = await db.user.findUnique({ where: { id: payload.sub } });
      if (!existing) {
        return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
      }

      const valid = await bcrypt.compare(currentPassword, existing.password);
      if (!valid) {
        return NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' }, { status: 400 });
      }

      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Aucune modification fournie.' }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: payload.sub },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, avatar: true, agencyId: true, stationId: true },
    });

    // Refresh JWT token if name changed
    if (updateData.name) {
      const newToken = await signToken({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        agencyId: user.agencyId,
        stationId: user.stationId,
        avatar: user.avatar,
      });
      await setAuthCookie(newToken);
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error('[users/me PATCH]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
