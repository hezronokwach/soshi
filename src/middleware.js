// Middleware for route protection
import { NextResponse } from 'next/server';

// Routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/session',
  '/api/auth/logout'
];

// Routes that start with these prefixes are also public
const publicPrefixes = [
  '/_next',
  '/favicon',
  '/images',
  '/fonts'
];

/**
 * Middleware function to protect routes
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Redirect root path to feed
  if (pathname === '/' || pathname === '/feed') {
    return NextResponse.redirect(new URL('/(main)/feed', request.url));
  }

  // Check if the route is public
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check for session token
  const sessionToken = request.cookies.get('session_token');

  // If no session token, redirect to login
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Continue to the protected route
  return NextResponse.next();
}

/**
 * Check if a route is public
 * @param {string} pathname - The route pathname
 * @returns {boolean} - True if the route is public
 */
function isPublicRoute(pathname) {
  // Check exact matches
  if (publicRoutes.includes(pathname)) {
    return true;
  }

  // Check prefixes
  for (const prefix of publicPrefixes) {
    if (pathname.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}

/**
 * Configure which routes this middleware applies to
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /_next (Next.js internals)
     * 2. /api/auth/* (auth API routes)
     * 3. /static (static files)
     * 4. /favicon.ico, /robots.txt (public files)
     */
    '/((?!_next|api/auth|static|favicon.ico|robots.txt).*)',
  ],
};
