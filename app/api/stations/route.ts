import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cityId = searchParams.get('cityId')
  const agencyId = searchParams.get('agencyId')
  const stations = await prisma.station.findMany({
    where: {
      ...(cityId ? { cityId } : {}),
      ...(agencyId ? { agencyId } : {}),
    },
    orderBy: { name: 'asc' },
    include: {
      city: { select: { id: true, name: true } },
      agency: { select: { id: true, name: true } },
    },
  })
  return NextResponse.json({ data: stations })
}
