import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ACCESS_CODE = process.env.ACCESS_CODE || 'tahiti2026'
const COOKIE_NAME = 'tahiti_access'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Laisser passer les routes API et les assets
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/login'
  ) {
    return NextResponse.next()
  }

  const cookie = request.cookies.get(COOKIE_NAME)
  if (cookie?.value === ACCESS_CODE) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
