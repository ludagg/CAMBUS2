import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError } from '@/lib/api'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      agencies: { include: { city: true, _count: { select: { departures: true, vehicles: true } } } },
      routes: { include: { originCity: true, destinationCity: true } },
      _count: { select: { agencies: true, routes: true } },
    },
  })
  if (!company) return NextResponse.json({ error: 'Compagnie introuvable' }, { status: 404 })
  return NextResponse.json({ data: company })
}

const updateSchema = z.object({
  name: z.string().optional(),
  logo: z.string().optional(),
  brandColor: z.string().optional(),
  description: z.string().optional(),
  email: z.string().email().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN'])
    const { id } = await params
    const body = updateSchema.parse(await req.json())
    const company = await prisma.company.update({ where: { id }, data: body })
    return NextResponse.json({ data: company })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN'])
    const { id } = await params
    await prisma.company.update({ where: { id }, data: { status: 'INACTIVE' } })
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    return handleError(err)
  }
}
