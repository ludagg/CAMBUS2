import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from './lib/auth';

const PROTECTED_PATHS = ['/bookings', '/checkout'];
const ADMIN_PATHS = ['/admin/super', '/admin/agency', '/admin/station'];

const ROLE_TO_PATH: Record<string, string> = {
  SUPER_ADMIN: '/admin/super',
  AGENCY_ADMIN: '/admin/agency',
  STATION_MANAGER: '/admin/station',
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAdmin = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  if (!isProtected && !isAdmin) return NextResponse.next();

  const token = getTokenFromRequest(req);

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const payload = await verifyToken(token);

    // Admin paths require specific roles
    if (isAdmin) {
      const allowedPath = ROLE_TO_PATH[payload.role.toUpperCase()];
      if (!allowedPath) {
        return NextResponse.redirect(new URL('/', req.url));
      }
      if (!pathname.startsWith(allowedPath)) {
        return NextResponse.redirect(new URL(allowedPath, req.url));
      }
    }

    return NextResponse.next();
  } catch {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/bookings', '/checkout', '/admin/:path*'],
};
