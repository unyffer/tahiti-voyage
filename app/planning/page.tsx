export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import PlanningClient from './PlanningClient'

export default async function PlanningPage() {
  const [{ data: rows, error }, { data: activites }] = await Promise.all([
    supabase
      .from('planning')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false }),
    supabase
      .from('activites')
      .select('id, nom, categorie, statut, date_heure, lieu')
      .not('date_heure', 'is', null),
  ])

  if (error) {
    return <p className="text-red-500">Erreur : {error.message}</p>
  }

  return <PlanningClient planning={rows ?? []} activites={activites ?? []} />
}
