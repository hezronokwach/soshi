import { NextResponse } from "next/server"

// This middleware redirects unauthenticated users to the login page
// and authenticated users away from login/register pages
export async function middleware(request) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl

  // Get the session cookie
  const sessionCookie = request.cookies.get("session_token")
  const isAuthenticated = !!sessionCookie

  // Auth pages that should redirect to feed if already logged in
  const authPages = ["/login", "/register"]

  // Protected pages that require authentication
  const protectedPages = ["/feed", "/profile", "/groups", "/notifications", "/chat", "/posts"]

  // Check if the page is an auth page and user is authenticated
  if (authPages.some((page) => pathname.startsWith(page)) && isAuthenticated) {
    return NextResponse.redirect(new URL("/feed", request.url))
  }

  // Check if the page is protected and user is not authenticated
  if (protectedPages.some((page) => pathname.startsWith(page)) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If the user is not authenticated and visits the home page, redirect to login
  if (pathname === "/" && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Continue with the request
  return NextResponse.next()
}

// Configure the paths that should trigger this middleware
export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/feed/:path*",
    "/profile/:path*",
    "/groups/:path*",
    "/notifications",
    "/chat/:path*",
    "/posts/:path*",
  ],
}
