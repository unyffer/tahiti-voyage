export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// GET — récupérer tous les points du tracé (pour la carte)
export async function GET() {
  const { data, error } = await supabase
    .from('journal_tracks')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — enregistrer une position manuelle (bouton "Je suis ici")
export async function POST(req: NextRequest) {
  const { auteur, lat, lng, ile, note } = await req.json()
  if (!auteur || !lat || !lng) {
    return NextResponse.json({ error: 'auteur, lat, lng requis' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('journal_tracks')
    .insert({ auteur, lat, lng, ile: ile ?? null, note: note ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
