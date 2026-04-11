export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'

function euros(n: number | null | undefined) {
  if (n == null) return '–'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function StatutBadge({ reste }: { reste: number | null }) {
  if (!reste || reste <= 0) return <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✅ Soldé</span>
  return <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">⏳ {euros(reste)} restant</span>
}

export default async function PaiementsPage() {
  const [{ data: logements }, { data: autres }] = await Promise.all([
    supabase.from('paiements_logements').select('*').order('id'),
    supabase.from('paiements_autres').select('*').order('id'),
  ])

  const totalLog = logements?.reduce((s, r) => s + (r.total ?? 0), 0) ?? 0
  const resteLog = logements?.reduce((s, r) => s + (r.reste_a_payer ?? 0), 0) ?? 0
  const totalAutres = autres?.reduce((s, r) => s + (r.total ?? 0), 0) ?? 0
  const resteAutres = autres?.reduce((s, r) => s + (r.reste_par_personne ?? 0) * 3, 0) ?? 0
  const totalGeneral = totalLog + totalAutres
  const resteTotal = resteLog + resteAutres

  // Calcul par personne depuis logements
  const parPersonne = {
    Régis: logements?.reduce((s, r) => s + (r.regis ?? 0), 0) ?? 0,
    Isa: logements?.reduce((s, r) => s + (r.isa ?? 0), 0) ?? 0,
    Agathe: logements?.reduce((s, r) => s + (r.agathe ?? 0), 0) ?? 0,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">💸 Paiements</h1>
        <p className="text-gray-500 mt-1">Suivi complet des dépenses du voyage</p>
      </div>

      {/* Résumé global */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total voyage</p>
          <p className="text-2xl font-bold text-gray-800">{euros(totalGeneral)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Reste à payer</p>
          <p className="text-2xl font-bold text-orange-500">{euros(resteTotal)}</p>
          <p className="text-sm text-gray-400">{euros(Math.round(resteTotal / 3))} / pers</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Déjà payé</p>
          <p className="text-2xl font-bold text-emerald-600">{euros(totalGeneral - resteTotal)}</p>
        </div>
      </div>

      {/* Par personne */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">👥 Répartition par personne (logements)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(Object.entries(parPersonne) as [string, number][]).map(([nom, montant]) => (
            <div key={nom} className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="font-semibold text-gray-700">{nom}</p>
              <p className="text-xl font-bold text-teal-700 mt-1">{euros(montant)}</p>
              <p className="text-xs text-gray-400 mt-1">payé (logements)</p>
            </div>
          ))}
        </div>
      </div>

      {/* Logements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-teal-700 text-white px-5 py-3">
          <h2 className="font-semibold text-lg">🏠 Logements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Logement</th>
                <th className="text-right px-4 py-3 text-gray-600 font-semibold">Régis</th>
                <th className="text-right px-4 py-3 text-gray-600 font-semibold">Isa</th>
                <th className="text-right px-4 py-3 text-gray-600 font-semibold">Agathe</th>
                <th className="text-right px-4 py-3 text-gray-600 font-semibold">Total</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Statut</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Échéance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logements?.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.description}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{p.regis ? euros(p.regis) : '–'}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{p.isa ? euros(p.isa) : '–'}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{p.agathe ? euros(p.agathe) : '–'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{euros(p.total)}</td>
                  <td className="px-4 py-3"><StatutBadge reste={p.reste_a_payer} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.date_echeance ?? '–'}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3">Total logements</td>
                <td className="px-4 py-3 text-right">{euros(parPersonne.Régis)}</td>
                <td className="px-4 py-3 text-right">{euros(parPersonne.Isa)}</td>
                <td className="px-4 py-3 text-right">{euros(parPersonne.Agathe)}</td>
                <td className="px-4 py-3 text-right">{euros(totalLog)}</td>
                <td className="px-4 py-3" colSpan={2}>
                  <span className="text-orange-600">{euros(resteLog)} restant</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Paiements hors logements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-purple-700 text-white px-5 py-3">
          <h2 className="font-semibold text-lg">🎯 Activités & transports</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Description</th>
                <th className="text-right px-4 py-3 text-gray-600 font-semibold">Total</th>
                <th className="text-right px-4 py-3 text-gray-600 font-semibold">/ pers</th>
                <th className="text-right px-4 py-3 text-gray-600 font-semibold">Reste / pers</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Situation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {autres?.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.description}</td>
                  <td className="px-4 py-3 text-right font-semibold">{euros(p.total)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{euros(p.par_personne)}</td>
                  <td className="px-4 py-3 text-right">
                    {!p.reste_par_personne || p.reste_par_personne <= 0 ? (
                      <span className="text-emerald-600 font-semibold">✅ 0</span>
                    ) : (
                      <span className="text-orange-600 font-semibold">{euros(p.reste_par_personne)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.situation ?? '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
