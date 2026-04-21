import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { handleError, bad } from '@/lib/api'
import { logAudit } from '@/lib/audit'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return bad('Non authentifié.', 401)
    const { id } = await params
    const entry = await prisma.waitlistEntry.findUnique({
      where: { id },
      select: { userId: true, status: true },
    })
    if (!entry) return bad("Entrée de liste d'attente introuvable.", 404)
    if (entry.userId !== session.sub && session.role !== 'SUPER_ADMIN') {
      return bad('Accès refusé.', 403)
    }
    if (entry.status === 'CANCELLED' || entry.status === 'PROMOTED') {
      return bad(`Cette entrée est déjà ${entry.status.toLowerCase()}.`, 409)
    }
    await prisma.waitlistEntry.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })
    await logAudit(
      { action: 'waitlist.cancel', entityType: 'WaitlistEntry', entityId: id },
      { session, req },
    )
    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    return handleError(err)
  }
}
