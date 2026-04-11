export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { ILES } from '@/lib/constants'
import Link from 'next/link'

function euros(n: number | null | undefined) {
  if (n == null) return ''
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

export default async function ActivitesPage() {
  const { data: activites } = await supabase
    .from('activites')
    .select('*')
    .eq('categorie', 'activite')
    .order('ile')
    .order('nom')

  const parIle = ILES.reduce<Record<string, typeof activites>>((acc, ile) => {
    acc[ile.slug] = (activites ?? []).filter((a) =>
      a.ile?.toLowerCase().includes(ile.nom.toLowerCase()) ||
      a.ile?.toLowerCase().includes(ile.slug)
    )
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">🎯 Activités</h1>
        <p className="text-gray-500 mt-1">Toutes les activités par île</p>
      </div>

      {ILES.map((ile) => {
        const acts = parIle[ile.slug] ?? []
        if (acts.length === 0) return null
        return (
          <div key={ile.slug} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`${ile.couleur} px-5 py-3 flex items-center justify-between`}>
              <h2 className="text-white font-semibold text-lg">
                {ile.emoji} {ile.nom}
              </h2>
              <Link href={`/iles/${ile.slug}`} className="text-white/80 hover:text-white text-sm">
                Voir la page →
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {acts.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800">{a.nom}</span>
                      {a.gratuit && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Gratuit</span>
                      )}
                      {a.statut === 'paye' && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✅ Payé</span>
                      )}
                      {a.statut === 'reserve' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">📋 Réservé</span>
                      )}
                    </div>
                    {a.commentaire && (
                      <p className="text-sm text-gray-500 mt-0.5">{a.commentaire}</p>
                    )}
                    {a.lien && (
                      <a href={a.lien} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-teal-600 hover:underline">
                        🔗 Lien
                      </a>
                    )}
                  </div>
                  {a.prix && (
                    <span className="font-semibold text-gray-700 whitespace-nowrap">{euros(a.prix)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
