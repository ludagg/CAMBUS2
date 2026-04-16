import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('JWT_SECRET must be set in production');
  }
  return new TextEncoder().encode(secret || 'cambus-dev-secret-key-do-not-use-in-production');
}
const COOKIE_NAME = 'auth_token';
const TOKEN_EXPIRY = '7d';

export interface JWTPayload {
  sub: string;      // user id
  email: string;
  name: string;
  role: string;
  agencyId?: string | null;
  stationId?: string | null;
  avatar?: string | null;
  iat?: number;
  exp?: number;
}

export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getJWTSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getJWTSecret());
  return payload as unknown as JWTPayload;
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const token = await getTokenFromCookies();
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get(COOKIE_NAME)?.value ?? null;
}

export async function getUserFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}
