export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// POST — toggle like (ajoute ou retire)
export async function POST(req: NextRequest) {
  const { post_id, auteur } = await req.json()
  if (!post_id || !auteur) {
    return NextResponse.json({ error: 'post_id et auteur requis' }, { status: 400 })
  }

  // Vérifier si le like existe
  const { data: existing } = await supabase
    .from('journal_likes')
    .select('id')
    .eq('post_id', post_id)
    .eq('auteur', auteur)
    .maybeSingle()

  if (existing) {
    // Retirer le like
    await supabase.from('journal_likes').delete().eq('id', existing.id)
    return NextResponse.json({ liked: false })
  } else {
    // Ajouter le like
    await supabase.from('journal_likes').insert({ post_id, auteur })
    return NextResponse.json({ liked: true })
  }
}
