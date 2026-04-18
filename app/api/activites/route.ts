export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { isReadonly, readonlyResponse } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ile = searchParams.get('ile')

  let query = supabase.from('activites').select('*').order('ile').order('categorie').order('nom')
  if (ile) query = query.eq('ile', ile)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  if (isReadonly(request)) return readonlyResponse()
  const body = await request.json()
  const { data, error } = await getSupabaseAdmin().from('activites').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  if (isReadonly(request)) return readonlyResponse()
  const body = await request.json()
  const { id, ...updates } = body
  const { data, error } = await getSupabaseAdmin()
    .from('activites').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  if (isReadonly(request)) return readonlyResponse()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const { error } = await getSupabaseAdmin().from('activites').delete().eq('id', id!)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
