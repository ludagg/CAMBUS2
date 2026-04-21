import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  clearSessionCookie,
  getSession,
  hashPassword,
  setSessionCookie,
  signSession,
  verifyPassword,
} from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { bad, handleError } from '@/lib/api'
import { clientKey, rateLimit } from '@/lib/rate-limit'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ data: null })

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      companyId: true,
      agencyId: true,
      stationId: true,
    },
  })
  return NextResponse.json({ data: user })
}

const patchSchema = z
  .object({
    name: z.string().min(2).max(80).optional(),
    email: z.string().email().optional(),
    avatar: z.string().max(400).nullable().optional(),
    currentPassword: z.string().min(1).optional(),
    newPassword: z.string().min(8).max(200).optional(),
  })
  .refine(
    (d) =>
      d.name !== undefined ||
      d.email !== undefined ||
      d.avatar !== undefined ||
      d.newPassword !== undefined,
    { message: 'Aucun changement fourni.' },
  )
  .refine((d) => !d.newPassword || d.currentPassword, {
    message: 'Le mot de passe actuel est requis pour en définir un nouveau.',
    path: ['currentPassword'],
  })

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return bad('Non authentifié.', 401)

    const rl = rateLimit(clientKey(req, `me-patch:${session.sub}`), {
      limit: 10,
      windowSec: 60,
    })
    if (!rl.ok) {
      return bad(
        `Trop de requêtes. Réessayez dans ${rl.retryAfterSeconds}s.`,
        429,
      )
    }

    const body = patchSchema.parse(await req.json())

    const user = await prisma.user.findUnique({ where: { id: session.sub } })
    if (!user) return bad('Utilisateur introuvable.', 404)

    if (body.email && body.email !== user.email) {
      const taken = await prisma.user.findUnique({ where: { email: body.email } })
      if (taken) return bad('Cet email est déjà utilisé.', 409)
    }

    let passwordHash: string | undefined
    if (body.newPassword) {
      const ok = await verifyPassword(body.currentPassword!, user.passwordHash)
      if (!ok) return bad('Mot de passe actuel incorrect.', 401)
      passwordHash = await hashPassword(body.newPassword)
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.avatar !== undefined ? { avatar: body.avatar } : {}),
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        companyId: true,
        agencyId: true,
        stationId: true,
      },
    })

    // Re-issue the session so the JWT reflects the new name/email.
    const token = await signSession({
      sub: updated.id,
      email: updated.email,
      role: updated.role,
      name: updated.name,
    })
    await setSessionCookie(token)

    return NextResponse.json({ data: updated })
  } catch (err) {
    return handleError(err)
  }
}

const deleteSchema = z.object({
  currentPassword: z.string().min(1),
  confirm: z.literal('DELETE'),
})

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return bad('Non authentifié.', 401)

    const rl = rateLimit(clientKey(req, `me-delete:${session.sub}`), {
      limit: 3,
      windowSec: 300,
    })
    if (!rl.ok) {
      return bad(
        `Trop de tentatives. Réessayez dans ${rl.retryAfterSeconds}s.`,
        429,
      )
    }

    const body = deleteSchema.parse(await req.json())
    const user = await prisma.user.findUnique({ where: { id: session.sub } })
    if (!user) return bad('Utilisateur introuvable.', 404)

    // Staff accounts can only be removed by a SUPER_ADMIN to avoid orphaning
    // Company/Agency/Station relations.
    if (user.role !== 'USER') {
      return bad(
        'Les comptes administrateurs doivent être supprimés par un SUPER_ADMIN.',
        403,
      )
    }

    const ok = await verifyPassword(body.currentPassword, user.passwordHash)
    if (!ok) return bad('Mot de passe incorrect.', 401)

    // Soft disassociate: keep BookingGroups (for accounting) but drop the
    // link so the historical reservations are anonymised.
    await prisma.$transaction([
      prisma.bookingGroup.updateMany({
        where: { userId: user.id },
        data: { userId: null },
      }),
      prisma.user.delete({ where: { id: user.id } }),
    ])

    await clearSessionCookie()
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    return handleError(err)
  }
}
