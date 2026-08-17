export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { isReadonly, readonlyResponse } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// GET — liste des posts avec photos, commentaires et likes
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ile = searchParams.get('ile')
  const limit = parseInt(searchParams.get('limit') ?? '60')

  let query = supabase
    .from('journal_posts')
    .select(`
      *,
      photos:journal_photos(*),
      comments:journal_comments(*),
      likes:journal_likes(*)
    `)
    .order('date_voyage', { ascending: false })
    .order('sort_order', { ascending: true })
    .limit(limit)

  if (ile) query = query.eq('ile', ile)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — créer un post (les photos sont uploadées séparément côté client,
//         puis leurs métadonnées sont envoyées ici dans le tableau "photos")
export async function POST(req: NextRequest) {
  if (isReadonly(req)) return readonlyResponse()

  const body = await req.json()
  const { photos: photosMeta, ...postData } = body

  // Insérer le post
  const { data: post, error: postErr } = await supabase
    .from('journal_posts')
    .insert(postData)
    .select()
    .single()

  if (postErr || !post) {
    return NextResponse.json({ error: postErr?.message ?? 'Erreur insertion' }, { status: 500 })
  }

  // Insérer les photos si présentes
  if (Array.isArray(photosMeta) && photosMeta.length > 0) {
    const rows = photosMeta.map((p: { storage_path: string; thumb_path?: string; width?: number; height?: number; taille_ko?: number }, i: number) => ({
      post_id: post.id,
      storage_path: p.storage_path,
      thumb_path: p.thumb_path ?? null,
      width: p.width ?? null,
      height: p.height ?? null,
      taille_ko: p.taille_ko ?? null,
      sort_order: i,
    }))
    const { error: photoErr } = await supabase.from('journal_photos').insert(rows)
    if (photoErr) {
      console.error('Photos insert error:', photoErr)
    }
  }

  // Ajouter la position au tracé (si lat/lng présents)
  if (postData.lat && postData.lng) {
    await supabase.from('journal_tracks').insert({
      auteur: postData.auteur,
      lat: postData.lat,
      lng: postData.lng,
      ile: postData.ile ?? null,
      note: `Post: ${(postData.texte ?? '').slice(0, 60) || 'Photo'}`,
    })
  }

  return NextResponse.json(post)
}

// PATCH — modifier texte / lieu / île d'un post
export async function PATCH(req: NextRequest) {
  if (isReadonly(req)) return readonlyResponse()

  const { id, ...updates } = await req.json()
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  const { data, error } = await supabase
    .from('journal_posts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — supprimer un post + ses photos du Storage
export async function DELETE(req: NextRequest) {
  if (isReadonly(req)) return readonlyResponse()

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

  // Récupérer les photos pour les supprimer du storage
  const { data: photos } = await supabase
    .from('journal_photos')
    .select('storage_path, thumb_path')
    .eq('post_id', id)

  if (photos?.length) {
    const paths = photos.flatMap(p =>
      [p.storage_path, p.thumb_path].filter((x): x is string => Boolean(x))
    )
    if (paths.length) {
      await supabase.storage.from('journal').remove(paths)
    }
  }

  const { error } = await supabase.from('journal_posts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
