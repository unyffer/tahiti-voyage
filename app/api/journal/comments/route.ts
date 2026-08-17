export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { isReadonly, readonlyResponse } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// POST — ajouter un commentaire
export async function POST(req: NextRequest) {
  const { post_id, auteur, texte } = await req.json()
  if (!post_id || !auteur || !texte?.trim()) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('journal_comments')
    .insert({ post_id, auteur, texte: texte.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — supprimer un commentaire
export async function DELETE(req: NextRequest) {
  if (isReadonly(req)) return readonlyResponse()

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const { error } = await supabase.from('journal_comments').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
