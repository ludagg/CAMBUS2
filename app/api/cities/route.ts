import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/db';

// GET /api/cities
export async function GET() {
  try {
    const cities = await db.city.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ cities });
  } catch (err) {
    console.error('[cities GET]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}

// POST /api/cities — Créer une ville (super_admin)
export async function POST(req: NextRequest) {
  try {
    const { name, region } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Le nom de la ville est requis.' }, { status: 400 });
    }

    const city = await db.city.create({ data: { name, region } });
    return NextResponse.json({ city }, { status: 201 });
  } catch (err) {
    console.error('[cities POST]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
