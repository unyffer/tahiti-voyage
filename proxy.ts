import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ACCESS_CODE          = process.env.ACCESS_CODE          || 'tahiti2026'
const ACCESS_CODE_READONLY = process.env.ACCESS_CODE_READONLY || 'tahiti-ro2026'
const COOKIE_NAME          = 'tahiti_access'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/login'
  ) {
    return NextResponse.next()
  }

  const cookie = request.cookies.get(COOKIE_NAME)
  const val = cookie?.value ?? ''

  if (val === ACCESS_CODE || val === ACCESS_CODE_READONLY) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
