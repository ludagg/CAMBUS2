import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSession, requireRole } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { assertOwnsCompany } from '@/lib/scoping'
import { logAudit } from '@/lib/audit'
import {
  DEFAULT_POLICY,
  validateTiers,
  type PolicyTier,
} from '@/lib/cancellation-policy'

/**
 * GET returns the company's policy, or the default shape (with isDefault=true)
 * if none exists. Public to any authenticated role to support client-side
 * disclosure of refund rules in the checkout UI.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return bad('Non authentifié.', 401)
    const { id } = await params
    const row = await prisma.cancellationPolicy.findUnique({
      where: { companyId: id },
    })
    if (!row) {
      return NextResponse.json({
        data: {
          companyId: id,
          deadlineHours: DEFAULT_POLICY.deadlineHours,
          tiers: DEFAULT_POLICY.tiers,
          notes: null,
          isDefault: true,
        },
      })
    }
    return NextResponse.json({
      data: { ...row, isDefault: false },
    })
  } catch (err) {
    return handleError(err)
  }
}

const upsertSchema = z.object({
  deadlineHours: z.number().int().min(0).max(24 * 30),
  tiers: z.unknown(),
  notes: z.string().max(2000).nullable().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    requireRole(session, ['SUPER_ADMIN', 'COMPANY_ADMIN'])
    const { id } = await params
    await assertOwnsCompany(session!, id)
    const body = upsertSchema.parse(await req.json())
    let tiers: PolicyTier[]
    try {
      tiers = validateTiers(body.tiers)
    } catch (err) {
      return bad(err instanceof Error ? err.message : 'tiers invalide.', 400)
    }

    const tiersJson = tiers as unknown as Prisma.InputJsonValue
    const row = await prisma.cancellationPolicy.upsert({
      where: { companyId: id },
      update: {
        deadlineHours: body.deadlineHours,
        tiers: tiersJson,
        notes: body.notes ?? null,
      },
      create: {
        companyId: id,
        deadlineHours: body.deadlineHours,
        tiers: tiersJson,
        notes: body.notes ?? null,
      },
    })
    await logAudit(
      {
        action: 'cancellation-policy.upsert',
        entityType: 'CancellationPolicy',
        entityId: row.id,
        metadata: { companyId: id, deadlineHours: body.deadlineHours, tierCount: tiers.length },
      },
      { session, req },
    )
    return NextResponse.json({ data: row })
  } catch (err) {
    return handleError(err)
  }
}
