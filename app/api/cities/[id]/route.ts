import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

// PATCH /api/cities/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const city = await db.city.update({
      where: { id },
      data: { name: data.name, region: data.region, status: data.status },
    });
    return NextResponse.json({ city });
  } catch (err) {
    console.error('[cities PATCH]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}

// DELETE /api/cities/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.city.update({ where: { id }, data: { status: 'inactive' } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[cities DELETE]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
