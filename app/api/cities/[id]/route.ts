import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { logAudit } from '@/lib/audit'

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  region: z.string().min(1).max(120).optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN'])
    const { id } = await params
    const body = updateSchema.parse(await req.json())

    if (body.name) {
      const exists = await prisma.city.findFirst({
        where: { name: body.name, id: { not: id } },
      })
      if (exists) return bad('Une ville avec ce nom existe déjà.', 409)
    }

    const city = await prisma.city.update({
      where: { id },
      data: {
        name: body.name,
        region: body.region,
        lat: body.lat === null ? null : body.lat,
        lng: body.lng === null ? null : body.lng,
        status: body.status,
      },
    })
    await logAudit(
      {
        action: 'city.update',
        entityType: 'City',
        entityId: id,
        metadata: { fields: Object.keys(body) },
      },
      { session, req },
    )
    return NextResponse.json({ data: city })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN'])
    const { id } = await params

    const city = await prisma.city.update({
      where: { id },
      data: { status: 'INACTIVE' },
    })
    await logAudit(
      { action: 'city.disable', entityType: 'City', entityId: id, metadata: { name: city.name } },
      { session, req },
    )
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    return handleError(err)
  }
}
