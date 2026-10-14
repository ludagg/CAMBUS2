import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Basic health check. Used by deploy platforms (Vercel, Fly, etc.) and
 * external monitoring to verify the app and the database are reachable.
 */
export async function GET() {
  const startedAt = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: 'ok',
      db: 'ok',
      uptimeMs: Date.now() - startedAt,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
      now: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json(
      { status: 'degraded', db: 'unreachable', },
      { status: 503 },
    )
  }
}
