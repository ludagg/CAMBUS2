import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword, signSession, setSessionCookie } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    const exists = await prisma.user.findUnique({ where: { email: body.email } })
    if (exists) return bad('Un compte avec cet email existe déjà.', 409)

    const passwordHash = await hashPassword(body.password)
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: 'USER',
        avatar: body.name.charAt(0).toUpperCase(),
      },
    })

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
      },
    }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
