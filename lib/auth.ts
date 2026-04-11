import { NextRequest, NextResponse } from 'next/server'

export function isReadonly(request: NextRequest): boolean {
  return request.cookies.get('tahiti_role')?.value === 'readonly'
}

export function readonlyResponse() {
  return NextResponse.json(
    { error: 'Mode lecture seule — modification non autorisée' },
    { status: 403 }
  )
}
