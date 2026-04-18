import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec la service_role key.
 * UNIQUEMENT côté serveur (routes API Next.js).
 * Cette clé bypass complètement le RLS → permet les écritures même avec RLS activé.
 * Ne jamais exposer cette clé côté client.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Variables Supabase admin manquantes (NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY)')
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
