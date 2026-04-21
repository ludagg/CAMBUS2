import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError } from '@/lib/api'

export async function GET() {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN'])

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        companyId: true,
        agencyId: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ data: users })
  } catch (err) {
    return handleError(err)
  }
}
