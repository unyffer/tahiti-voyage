import { NextRequest, NextResponse } from 'next/server'

const ACCESS_CODE = process.env.ACCESS_CODE || 'tahiti2026'
const COOKIE_NAME = 'tahiti_access'

export async function POST(request: NextRequest) {
  const { code } = await request.json()

  if (code !== ACCESS_CODE) {
    return NextResponse.json({ error: 'Code incorrect' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, ACCESS_CODE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 jours
    path: '/',
  })

  return response
}
