import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { joinWaitlist, WaitlistError } from '@/lib/waitlist'
import { logAudit } from '@/lib/audit'
import { clientKey, rateLimit } from '@/lib/rate-limit'

/**
 * GET /api/waitlist — returns the current user's WAITING or NOTIFIED entries.
 * Requires authentication.
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return bad('Non authentifié.', 401)
    const entries = await prisma.waitlistEntry.findMany({
      where: {
        userId: session.sub,
        status: { in: ['WAITING', 'NOTIFIED'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        departure: {
          select: {
            id: true,
            departureAt: true,
            priceCents: true,
            currency: true,
            route: {
              select: {
                originCity: { select: { name: true } },
                destinationCity: { select: { name: true } },
              },
            },
          },
        },
      },
    })
    return NextResponse.json({ data: entries })
  } catch (err) {
    return handleError(err)
  }
}

const createSchema = z.object({
  departureId: z.string(),
  passengerFullName: z.string().min(2).max(120).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().email().max(160).optional(),
  seatsRequested: z.number().int().min(1).max(6).default(1),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    // Anonymous joins notify arbitrary contacts later: throttle per IP.
    const rl = rateLimit(clientKey(req, session ? `waitlist:${session.sub}` : 'waitlist-anon'), {
      limit: session ? 20 : 5,
      windowSec: 600,
    })
    if (!rl.ok) return bad(`Trop de demandes. Réessayez dans ${rl.retryAfterSeconds}s.`, 429)
    const body = createSchema.parse(await req.json())

    let passengerFullName = body.passengerFullName
    let email = body.email
    let phone = body.phone
    let userId: string | null = null

    if (session) {
      userId = session.sub
      if (!passengerFullName || !email) {
        const user = await prisma.user.findUnique({
          where: { id: session.sub },
          select: { name: true, email: true },
        })
        passengerFullName = passengerFullName ?? user?.name ?? undefined
        email = email ?? user?.email ?? undefined
      }
    }

    if (!passengerFullName)
      return bad('Nom du passager requis.', 400)
    if (!email && !phone)
      return bad('Email ou téléphone requis pour être notifié.', 400)

    const result = await joinWaitlist({
      departureId: body.departureId,
      userId,
      passengerFullName,
      email: email ?? null,
      phone: phone ?? null,
      seatsRequested: body.seatsRequested,
    })

    await logAudit(
      {
        action: 'waitlist.join',
        entityType: 'WaitlistEntry',
        entityId: result.id,
        metadata: { departureId: body.departureId, seatsRequested: body.seatsRequested },
      },
      { session, req },
    )

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err) {
    if (err instanceof WaitlistError) return bad(err.message, err.status)
    return handleError(err)
  }
}
