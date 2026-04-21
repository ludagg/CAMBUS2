import type { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import type { SessionPayload } from './auth'

export interface AuditInput {
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown> | null
}

/**
 * Record a row in AuditLog. Never throws — audit logging must not break a
 * mutation that otherwise succeeded. Failures are logged to stderr.
 *
 * Wire this helper on every endpoint that mutates admin-controlled data:
 * price changes, departure cancellations, soft-deletes, driver / incident
 * mutations. Pass the parent `NextRequest` when available so IP + UA can be
 * captured; pass the session so we log the actor and role.
 */
export async function logAudit(
  input: AuditInput,
  ctx: {
    session: SessionPayload | null
    req?: NextRequest
  },
): Promise<void> {
  try {
    const ip = ctx.req?.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null
    const userAgent = ctx.req?.headers.get('user-agent') ?? null
    await prisma.auditLog.create({
      data: {
        actorUserId: ctx.session?.sub ?? null,
        actorRole: ctx.session?.role ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata:
          input.metadata === undefined || input.metadata === null
            ? Prisma.JsonNull
            : (input.metadata as Prisma.InputJsonValue),
        ip,
        userAgent,
      },
    })
  } catch (err) {
    console.error('[audit] failed to record event', { input, err })
  }
}
