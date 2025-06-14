import { NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// Helper function to validate session with Go backend
async function validateSession(sessionToken) {
  try {
    const response = await fetch(`${API_URL}/api/auth/session`, {
      method: "GET",
      headers: {
        "Cookie": `session_token=${sessionToken}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    })

    return response.ok
  } catch (error) {
    console.error("Session validation error:", error)
    return false
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Get the session cookie
  const sessionCookie = request.cookies.get("session_token")

  // Auth pages that should redirect to feed if already logged in
  const authPages = ["/login", "/register"]

  // Protected pages that require authentication
  const protectedPages = ["/feed", "/profile", "/groups", "/notifications", "/chat", "/posts"]

  // Public pages that don't need authentication
  const publicPages = ["/about", "/contact", "/terms", "/privacy"]

  // Skip validation for public pages and static assets
  if (publicPages.some((page) => pathname.startsWith(page)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")) {
    return NextResponse.next()
  }

  // Validate session with backend if cookie exists
  let isAuthenticated = false
  if (sessionCookie) {
    isAuthenticated = await validateSession(sessionCookie.value)

    // If session is invalid, clear the cookie
    if (!isAuthenticated) {
      const response = NextResponse.redirect(new URL("/login", request.url))
      response.cookies.delete("session_token")
      return response
    }
  }

  // Handle root path
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/feed", request.url))
    } else {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // Redirect authenticated users away from auth pages
  if (authPages.some((page) => pathname.startsWith(page)) && isAuthenticated) {
    return NextResponse.redirect(new URL("/feed", request.url))
  }

  // Redirect unauthenticated users to login for protected pages
  if (protectedPages.some((page) => pathname.startsWith(page)) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)",
  ],
}
