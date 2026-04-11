export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function euros(n: number | null | undefined) {
  if (n == null) return '–'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

const ILE_EMOJIS: Record<string, string> = {
  tahiti: '🌺', moorea: '🐋', "taha'a": '🌸', maupiti: '🤿', 'bora bora': '🏝️',
}

export default async function LogementsPage() {
  const [{ data: logements }, { data: paiements }] = await Promise.all([
    supabase.from('logements').select('*').order('id'),
    supabase.from('paiements_logements').select('*').order('id'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">🏠 Logements</h1>
        <p className="text-gray-500 mt-1">Vue consolidée de tous les hébergements</p>
      </div>

      {/* Tableau logements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Île</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Période</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Total</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Reste</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Échéance</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Lien</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paiements?.map((p) => {
                const log = logements?.find((l) =>
                  l.ile?.toLowerCase().includes(p.description?.split(' ')[0]?.toLowerCase() ?? '')
                )
                const emoji = ILE_EMOJIS[p.description?.toLowerCase().split(' ').slice(-1)[0]] ?? '🏠'
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.description}</td>
                    <td className="px-4 py-3 text-gray-600">{log?.periode ?? '–'}</td>
                    <td className="px-4 py-3 font-semibold">{euros(p.total)}</td>
                    <td className="px-4 py-3">
                      {p.reste_a_payer && p.reste_a_payer > 0 ? (
                        <span className="text-orange-600 font-semibold">{euros(p.reste_a_payer)}</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">✅ Soldé</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.date_echeance ?? '–'}</td>
                    <td className="px-4 py-3">
                      {p.lien_reservation ? (
                        <a href={p.lien_reservation} target="_blank" rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-700 font-medium">
                          🔗 Voir
                        </a>
                      ) : log?.lien_annonce ? (
                        <a href={log.lien_annonce} target="_blank" rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-700 font-medium">
                          🔗 Annonce
                        </a>
                      ) : '–'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commentaires et questions par logement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {logements?.map((l) => (
          (l.commentaires || l.questions) && (
            <div key={l.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-2">
                {ILE_EMOJIS[l.ile?.toLowerCase()] ?? '🏠'} {l.ile} · {l.periode}
              </h3>
              {l.commentaires && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 mb-2">
                  💬 {l.commentaires}
                </div>
              )}
              {l.questions && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  ❓ {l.questions}
                </div>
              )}
            </div>
          )
        ))}
      </div>
    </div>
  )
}
