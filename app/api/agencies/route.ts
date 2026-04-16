import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';

// GET /api/agencies
export async function GET() {
  try {
    const agencies = await db.agency.findMany({
      where: { status: 'active' },
      include: {
        stations: true,
        _count: { select: { trips: true } },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ agencies });
  } catch (err) {
    console.error('[agencies GET]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}

// POST /api/agencies — Créer une agence (super_admin)
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { name, logo, logoUrl, colorHex, contactEmail } = data;

    if (!name) {
      return NextResponse.json({ error: 'Le nom de l\'agence est requis.' }, { status: 400 });
    }

    const agency = await db.agency.create({
      data: { name, logo, logoUrl, colorHex, contactEmail },
    });

    return NextResponse.json({ agency }, { status: 201 });
  } catch (err) {
    console.error('[agencies POST]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
