export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { PlanningRow } from '@/types'
import Link from 'next/link'

const ILE_EMOJIS: Record<string, string> = {
  tahiti: '🌺',
  moorea: '🐋',
  "taha'a": '🌸',
  maupiti: '🤿',
  'bora bora': '🏝️',
}

function getEmoji(lieu: string) {
  return ILE_EMOJIS[lieu.toLowerCase()] ?? '📍'
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  } catch {
    return d
  }
}

export default async function PlanningPage() {
  const { data: rows, error } = await supabase.from('planning').select('*').order('date_debut')

  if (error) {
    return <p className="text-red-500">Erreur de chargement : {error.message}</p>
  }

  const planning: PlanningRow[] = rows ?? []
  const sejours = planning.filter((p) => p.type === 'sejour')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📅 Planning détaillé</h1>
        <p className="text-gray-500 mt-1">4 septembre → 2 octobre 2026 · 28 nuits</p>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-teal-200" />
        <div className="space-y-4">
          {planning.map((etape, i) => {
            const isVoyage = etape.type !== 'sejour'
            const slug = etape.lieu.toLowerCase().replace(' ', '-')
            const lienIle = !isVoyage ? `/iles/${slug}` : null

            return (
              <div key={etape.id} className="relative flex gap-4">
                {/* Pastille timeline */}
                <div
                  className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-sm border-2 ${
                    isVoyage ? 'bg-gray-100 border-gray-300' : 'bg-white border-teal-300'
                  }`}
                >
                  {isVoyage ? '✈️' : getEmoji(etape.lieu)}
                </div>

                {/* Contenu */}
                <div
                  className={`flex-1 rounded-xl p-4 shadow-sm border ${
                    isVoyage ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      {lienIle ? (
                        <Link
                          href={lienIle}
                          className="text-lg font-bold text-teal-700 hover:text-teal-800"
                        >
                          {etape.lieu}
                        </Link>
                      ) : (
                        <h3 className="text-lg font-bold text-gray-600">{etape.lieu}</h3>
                      )}
                      <p className="text-sm text-gray-500">
                        {formatDate(etape.date_debut)} → {formatDate(etape.date_fin)}
                        {etape.nuits && ` · ${etape.nuits} nuit${etape.nuits > 1 ? 's' : ''}`}
                      </p>
                    </div>
                    {etape.nuits && (
                      <span className="bg-teal-100 text-teal-800 text-xs font-semibold px-2 py-1 rounded-full">
                        {etape.nuits} nuits
                      </span>
                    )}
                  </div>

                  {etape.notes && (
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-2">
                      {etape.notes}
                    </p>
                  )}

                  {lienIle && (
                    <Link
                      href={lienIle}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium mt-2 inline-block"
                    >
                      Voir la page {etape.lieu} →
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
