import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || url.includes('REMPLACER') || !key || key.includes('REMPLACER')) {
    // Retourner un client "vide" qui ne lance pas d'erreur au build
    // Il plantera à l'exécution réelle si Supabase n'est pas configuré
    return createClient('https://placeholder.supabase.co', 'placeholder-key')
  }

  _supabase = createClient(url, key)
  return _supabase
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
