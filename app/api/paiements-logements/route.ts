export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { isReadonly, readonlyResponse } from '@/lib/auth'

export async function GET() {
  const { data, error } = await supabase.from('paiements_logements').select('*').order('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  if (isReadonly(request)) return readonlyResponse()
  const body = await request.json()
  const { data, error } = await supabase.from('paiements_logements').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  if (isReadonly(request)) return readonlyResponse()
  const body = await request.json()
  const { id, ...updates } = body
  const { data, error } = await supabase
    .from('paiements_logements').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  if (isReadonly(request)) return readonlyResponse()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const { error } = await supabase.from('paiements_logements').delete().eq('id', id!)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
