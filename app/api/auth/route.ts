import { NextRequest, NextResponse } from 'next/server'

const ACCESS_CODE          = process.env.ACCESS_CODE          || 'tahiti2026'
const ACCESS_CODE_READONLY = process.env.ACCESS_CODE_READONLY || 'tahiti-ro2026'
const COOKIE_NAME          = 'tahiti_access'
const ROLE_COOKIE          = 'tahiti_role'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30,
  path: '/',
}

export async function POST(request: NextRequest) {
  const { code } = await request.json()

  let role: 'admin' | 'readonly' | null = null
  if (code === ACCESS_CODE)          role = 'admin'
  else if (code === ACCESS_CODE_READONLY) role = 'readonly'

  if (!role) {
    return NextResponse.json({ error: 'Code incorrect' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true, role })
  response.cookies.set(COOKIE_NAME, code, COOKIE_OPTS)
  // Le cookie de rôle est lisible en JS (httpOnly:false) pour les composants client
  response.cookies.set(ROLE_COOKIE, role, { ...COOKIE_OPTS, httpOnly: false })
  return response
}
