import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyPassword, signSession, setSessionCookie } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { rateLimit, clientKey } from '@/lib/rate-limit'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())

    const ipRl = rateLimit(clientKey(req, 'login-ip'), { limit: 10, windowSec: 60 })
    if (!ipRl.ok) return bad(`Trop de tentatives. Réessayez dans ${ipRl.retryAfterSeconds}s.`, 429)
    const emailRl = rateLimit(`login-email:${body.email.toLowerCase()}`, { limit: 5, windowSec: 60 })
    if (!emailRl.ok) return bad(`Trop de tentatives pour cet email. Réessayez dans ${emailRl.retryAfterSeconds}s.`, 429)

    const user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user) return bad('Email ou mot de passe incorrect.', 401)

    const valid = await verifyPassword(body.password, user.passwordHash)
    if (!valid) return bad('Email ou mot de passe incorrect.', 401)

    const token = await signSession({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })
    await setSessionCookie(token)

    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        companyId: user.companyId,
        agencyId: user.agencyId,
        stationId: user.stationId,
      },
    })
  } catch (err) {
    return handleError(err)
  }
}
