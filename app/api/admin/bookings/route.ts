import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession, requireRole } from '@/lib/auth';
import { getSessionScope } from '@/lib/scoping';
import { handleError } from '@/lib/api';
import { dayRange } from '@/lib/datetime';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER']);

    const s = await getSessionScope(session!);
    const { searchParams } = new URL(req.url);

    const q = searchParams.get('q');
    const status = searchParams.get('status');
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');
    const cursor = searchParams.get('cursor');
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 25));

    if (s.role !== 'SUPER_ADMIN' && !s.companyId && !s.agencyId) {
       return NextResponse.json({ data: { items: [], nextCursor: null } });
    }

    const departureScope: Prisma.DepartureWhereInput =
      s.role === 'SUPER_ADMIN'
        ? {}
        : s.role === 'COMPANY_ADMIN'
          ? { route: { companyId: s.companyId ?? '__none__' } }
          : { agencyId: s.agencyId ?? '__none__' };

    const where: Prisma.BookingGroupWhereInput = {
      bookings: { some: { departure: departureScope } },
    };

    if (status) {
      where.status = status as any;
    }

    if (fromStr && toStr) {
      const from = dayRange(fromStr).start;
      const to = dayRange(toStr).end;
      where.createdAt = { gte: from, lte: to };
    }

    if (q) {
      const qLower = q.toLowerCase();
      where.OR = [
        { id: { endsWith: qLower } },
        { contactName: { contains: qLower, mode: 'insensitive' } },
        { contactEmail: { contains: qLower, mode: 'insensitive' } },
        { contactPhone: { contains: qLower, mode: 'insensitive' } },
        { bookings: { some: { passengers: { some: { fullName: { contains: qLower, mode: 'insensitive' } } } } } }
      ];
    }

    const items = await prisma.bookingGroup.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        payment: { select: { method: true, status: true } },
        bookings: {
          where: { departure: departureScope },
          include: {
            departure: {
              include: {
                route: {
                  include: {
                    originCity: { select: { name: true } },
                    destinationCity: { select: { name: true } },
                  }
                },
                agency: { select: { name: true } }
              }
            },
            passengers: { select: { fullName: true, idNumber: true, seat: true } }
          }
        }
      }
    });

    let nextCursor: string | null = null;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem!.id;
    }

    const formattedItems = items.map((g: any) => {
      const totalCents = g.bookings.reduce((sum: number, b: any) => sum + b.priceCents, 0);
      return {
        id: g.id,
        reference: g.id.slice(-8).toUpperCase(),
        status: g.status,
        tripType: g.tripType,
        channel: g.channel,
        totalCents,
        contactName: g.contactName,
        contactEmail: g.contactEmail,
        contactPhone: g.contactPhone,
        createdAt: g.createdAt.toISOString(),
        payment: g.payment,
        bookings: g.bookings.map((b: any) => ({
          id: b.id,
          leg: b.leg,
          status: b.status,
          seats: b.seats,
          departure: {
            id: b.departure.id,
            departureAt: b.departure.departureAt.toISOString(),
            origin: b.departure.route.originCity.name,
            destination: b.departure.route.destinationCity.name,
            agencyName: b.departure.agency.name,
          },
          passengers: b.passengers
        }))
      };
    });

    return NextResponse.json({ data: { items: formattedItems, nextCursor } });
  } catch (err) {
    return handleError(err);
  }
}
