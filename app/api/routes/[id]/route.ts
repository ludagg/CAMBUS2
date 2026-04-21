import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError } from '@/lib/api'
import { assertOwnsRoute } from '@/lib/scoping'

const updateSchema = z.object({
  distanceKm: z.number().int().positive().optional(),
  defaultDurationMin: z.number().int().positive().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN'])
    const { id } = await params
    await assertOwnsRoute(session!, id)
    const body = updateSchema.parse(await req.json())
    const route = await prisma.route.update({ where: { id }, data: body })
    return NextResponse.json({ data: route })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN'])
    const { id } = await params
    await assertOwnsRoute(session!, id)
    await prisma.route.delete({ where: { id } })
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    return handleError(err)
  }
}
