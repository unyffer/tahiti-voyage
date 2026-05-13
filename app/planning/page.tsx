export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import PlanningClient from './PlanningClient'

export default async function PlanningPage() {
  const { data: rows, error } = await supabase
    .from('planning')
    .select('*')
    .order('sort_order', { ascending: true, nullsFirst: false })

  if (error) {
    return <p className="text-red-500">Erreur : {error.message}</p>
  }

  return <PlanningClient planning={rows ?? []} />
}
