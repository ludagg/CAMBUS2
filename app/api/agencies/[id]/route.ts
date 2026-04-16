import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

// PATCH /api/agencies/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const agency = await db.agency.update({
      where: { id },
      data: {
        name: data.name,
        contactEmail: data.contactEmail,
        colorHex: data.colorHex,
        logo: data.logo,
        status: data.status,
      },
    });
    return NextResponse.json({ agency });
  } catch (err) {
    console.error('[agencies PATCH]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}

// DELETE /api/agencies/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.agency.update({ where: { id }, data: { status: 'inactive' } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[agencies DELETE]', err);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
