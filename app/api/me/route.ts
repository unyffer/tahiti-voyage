export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const role = request.cookies.get('tahiti_role')?.value ?? null
  return NextResponse.json({ role })
}
