import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken, COOKIE_NAME } from '@/lib/session'

// Routes accessible without a session
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Static assets — never intercept
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.(svg|png|jpg|jpeg|ico|webp|woff2?)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Public paths — allow through (but redirect authenticated users away from /login)
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (pathname.startsWith('/login')) {
      const token = req.cookies.get(COOKIE_NAME)?.value
      if (token) {
        const session = await verifySessionToken(token)
        if (session) {
          const dest = session.role === 'admin' ? '/admin' : '/dashboard'
          return NextResponse.redirect(new URL(dest, req.url))
        }
      }
    }
    return NextResponse.next()
  }

  // Root redirect
  if (pathname === '/') {
    const token = req.cookies.get(COOKIE_NAME)?.value
    if (!token) return NextResponse.redirect(new URL('/login', req.url))
    const session = await verifySessionToken(token)
    if (!session) return NextResponse.redirect(new URL('/login', req.url))
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // All other routes — require valid session
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  const session = await verifySessionToken(token)
  if (!session) {
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete(COOKIE_NAME)
    return res
  }

  // Admin-only gate: client role cannot access /admin
  if (pathname.startsWith('/admin') && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
