import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole, hashPassword } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { logAudit } from '@/lib/audit'

/**
 * Admin user PATCH. SUPER_ADMIN only.
 *
 * Note: the User model does not currently expose a `status` enum so there is
 * no soft-disable; the standard way to revoke access today is to either reset
 * the password (`newPassword`) or move the user out of any company / agency
 * scope (set companyId/agencyId/stationId to null + role to USER).
 */
const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  role: z.enum(['USER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER']).optional(),
  companyId: z.string().nullable().optional(),
  agencyId: z.string().nullable().optional(),
  stationId: z.string().nullable().optional(),
  newPassword: z.string().min(8).max(120).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN'])
    const { id } = await params
    const body = updateSchema.parse(await req.json())

    const data: {
      name?: string
      role?: 'USER' | 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'AGENCY_ADMIN' | 'STATION_MANAGER'
      companyId?: string | null
      agencyId?: string | null
      stationId?: string | null
      passwordHash?: string
    } = {}
    if (body.name !== undefined) data.name = body.name
    if (body.role !== undefined) data.role = body.role
    if (body.companyId !== undefined) data.companyId = body.companyId
    if (body.agencyId !== undefined) data.agencyId = body.agencyId
    if (body.stationId !== undefined) data.stationId = body.stationId
    if (body.newPassword) data.passwordHash = await hashPassword(body.newPassword)

    if (Object.keys(data).length === 0) return bad('Aucun champ à mettre à jour.', 400)

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        agencyId: true,
        stationId: true,
        updatedAt: true,
      },
    })
    await logAudit(
      {
        action: 'user.update',
        entityType: 'User',
        entityId: id,
        metadata: {
          fields: Object.keys(body).filter((k) => k !== 'newPassword'),
          passwordReset: Boolean(body.newPassword),
        },
      },
      { session, req },
    )
    return NextResponse.json({ data: user })
  } catch (err) {
    return handleError(err)
  }
}
