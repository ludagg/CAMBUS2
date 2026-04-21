import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const cities = await prisma.city.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, region: true, lat: true, lng: true },
  })
  return NextResponse.json({ data: cities })
}
