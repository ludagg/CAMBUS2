import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import type { Role, User } from '@prisma/client'

const COOKIE_NAME = 'easytravel_session'
const DEFAULT_SECRET = 'dev-secret-change-me-please-change-me-change-me-change-me'
const ALG = 'HS256'

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
      throw new Error(
        'AUTH_SECRET environment variable is required outside local development. Generate one with `openssl rand -hex 64`.',
      )
    }
    return new TextEncoder().encode(DEFAULT_SECRET)
  }
  if (secret.length < 32) {
    throw new Error('AUTH_SECRET must be at least 32 characters long.')
  }
  return new TextEncoder().encode(secret)
}

export interface SessionPayload {
  sub: string
  email: string
  role: Role
  name: string
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      role: payload.role as Role,
      name: String(payload.name),
    }
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null
  const claims = await verifySession(token)
  if (!claims) return null

  // The JWT lives 30 days: re-read the account on every request so a deleted
  // account is rejected and a changed role takes effect immediately.
  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: { email: true, role: true, name: true },
  })
  if (!user) return null
  return { sub: claims.sub, email: user.email, role: user.role, name: user.name }
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  if (!session) return null
  return prisma.user.findUnique({ where: { id: session.sub } })
}

export async function setSessionCookie(token: string) {
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function requireRole(session: SessionPayload | null, roles: Role[]) {
  if (!session) throw new AuthError('Non authentifié', 401)
  if (!roles.includes(session.role)) throw new AuthError('Accès refusé', 403)
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status = 401) {
    super(message)
    this.status = status
  }
}
