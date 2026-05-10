import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Route definitions
const publicRoutes = ['/', '/login'];
const voterRoutePrefix = '/dashboard';
const adminRoutePrefix = '/admin';

/**
 * Checks if a pathname matches any of the given routes.
 * Supports exact matches and prefix matches with trailing paths.
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || (route === '/' && pathname === '/')
  );
}

function isVoterRoute(pathname: string): boolean {
  return (
    pathname === voterRoutePrefix ||
    pathname.startsWith(`${voterRoutePrefix}/`)
  );
}

function isAdminRoute(pathname: string): boolean {
  return (
    pathname === adminRoutePrefix ||
    pathname.startsWith(`${adminRoutePrefix}/`)
  );
}

function isAuthApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/auth');
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow NextAuth API routes to pass through
  if (isAuthApiRoute(pathname)) {
    return NextResponse.next();
  }

  // Allow public routes without authentication
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Get the JWT token from the request
  const token = await getToken({ req: request });

  // If no token and trying to access protected routes, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = token.role as string | undefined;

  // Admin routes: only ADMIN role can access
  if (isAdminRoute(pathname)) {
    if (userRole !== 'ADMIN') {
      // Voters trying to access admin routes get redirected to voter dashboard
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  }

  // Voter routes: both VOTER and ADMIN can access
  if (isVoterRoute(pathname)) {
    if (userRole === 'VOTER' || userRole === 'ADMIN') {
      return NextResponse.next();
    }
    // Unknown role, redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // For any other API routes, require authentication (already checked above)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder files (SVGs, images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.ico$).*)',
  ],
};
