import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError } from '@/lib/api'

/**
 * GET /api/audit — paginated audit log reader. SUPER_ADMIN only.
 *
 * Query params:
 *  - entityType, entityId → scope to a specific record
 *  - actorUserId          → scope to an actor
 *  - before (ISO date)    → cursor; returns rows strictly before this createdAt
 *  - limit (1..200)       → page size, defaults to 50
 */
const querySchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  actorUserId: z.string().optional(),
  action: z.string().optional(),
  before: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN'])
    const url = new URL(req.url)
    const q = querySchema.parse(Object.fromEntries(url.searchParams.entries()))

    const where: {
      entityType?: string
      entityId?: string
      actorUserId?: string
      action?: { contains: string; mode: 'insensitive' }
      createdAt?: { lt: Date }
    } = {}
    if (q.entityType) where.entityType = q.entityType
    if (q.entityId) where.entityId = q.entityId
    if (q.actorUserId) where.actorUserId = q.actorUserId
    if (q.action) where.action = { contains: q.action, mode: 'insensitive' }
    if (q.before) where.createdAt = { lt: new Date(q.before) }

    const entries = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: q.limit,
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
    })
    return NextResponse.json({
      data: entries,
      nextCursor: entries.length === q.limit ? entries[entries.length - 1].createdAt : null,
    })
  } catch (err) {
    return handleError(err)
  }
}
