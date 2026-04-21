import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import type { Role, User } from '@prisma/client'

const COOKIE_NAME = 'easytravel_session'
const DEFAULT_SECRET = 'dev-secret-change-me-please-change-me-change-me-change-me'
const ALG = 'HS256'

function getSecret() {
  const secret = process.env.AUTH_SECRET || DEFAULT_SECRET
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
  return verifySession(token)
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
