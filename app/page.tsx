export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { ILES, BUDGET_TOTAL, BUDGET_PAR_PERSONNE } from '@/lib/constants'
import Link from 'next/link'

function euros(n: number | null | undefined) {
  if (n == null) return '–'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

export default async function DashboardPage() {
  const [{ data: planning }, { data: paiementsLog }, { data: paiementsAutres }] = await Promise.all([
    supabase.from('planning').select('*').order('date_debut'),
    supabase.from('paiements_logements').select('*'),
    supabase.from('paiements_autres').select('*'),
  ])

  const totalResteLog = paiementsLog?.reduce((s, r) => s + (r.reste_a_payer ?? 0), 0) ?? 0
  const totalResteAutres = paiementsAutres?.reduce((s, r) => s + (r.reste_par_personne ?? 0) * 3, 0) ?? 0
  const totalReste = totalResteLog + totalResteAutres

  const prochaines = paiementsLog
    ?.filter((r) => r.reste_a_payer && r.reste_a_payer > 0 && r.date_echeance)
    .sort((a, b) => (a.date_echeance! > b.date_echeance! ? 1 : -1))
    .slice(0, 3) ?? []

  const sejours = planning?.filter((p) => p.type === 'sejour') ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-cyan-600 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-1">🌺 Voyage Tahiti 2026</h1>
        <p className="text-teal-100 text-lg">
          4 septembre → 2 octobre · 28 nuits · Régis · Isa · Agathe
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {ILES.map((ile) => (
            <Link
              key={ile.slug}
              href={`/iles/${ile.slug}`}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-sm font-medium transition-colors"
            >
              {ile.emoji} {ile.nom}
            </Link>
          ))}
        </div>
      </div>

      {/* Cards budget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Budget total</p>
          <p className="text-3xl font-bold text-gray-800">{euros(BUDGET_TOTAL)}</p>
          <p className="text-sm text-gray-400 mt-1">{euros(BUDGET_PAR_PERSONNE)} / personne</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Reste à payer</p>
          <p className="text-3xl font-bold text-orange-500">{euros(totalReste)}</p>
          <p className="text-sm text-gray-400 mt-1">{euros(Math.round(totalReste / 3))} / personne</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Déjà payé</p>
          <p className="text-3xl font-bold text-emerald-600">{euros(BUDGET_TOTAL - totalReste)}</p>
          <p className="text-sm text-gray-400 mt-1">
            {Math.round(((BUDGET_TOTAL - totalReste) / BUDGET_TOTAL) * 100)}% du budget
          </p>
        </div>
      </div>

      {/* Itinéraire rapide */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📅 Itinéraire</h2>
        <div className="flex flex-wrap gap-2">
          {sejours.map((etape, i) => (
            <div key={i} className="flex items-center gap-1">
              <Link
                href={`/iles/${etape.lieu.toLowerCase().replace(' ', '-')}`}
                className="bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <div className="font-semibold">{etape.lieu}</div>
                <div className="text-xs text-teal-600">
                  {etape.nuits} nuits
                </div>
              </Link>
              {i < sejours.length - 1 && (
                <span className="text-gray-300 text-xl">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Prochaines échéances */}
      {prochaines.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">⏰ Prochaines échéances</h2>
          <div className="space-y-3">
            {prochaines.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{p.description}</p>
                  <p className="text-sm text-orange-600">Échéance : {p.date_echeance}</p>
                </div>
                <span className="font-bold text-orange-600 text-lg">{euros(p.reste_a_payer)}</span>
              </div>
            ))}
          </div>
          <Link href="/paiements" className="text-teal-600 hover:text-teal-700 text-sm font-medium mt-3 inline-block">
            Voir tous les paiements →
          </Link>
        </div>
      )}

      {/* Liens rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/planning', emoji: '📅', label: 'Planning' },
          { href: '/logements', emoji: '🏠', label: 'Logements' },
          { href: '/activites', emoji: '🎯', label: 'Activités' },
          { href: '/checklist', emoji: '✅', label: 'Checklist' },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="bg-white hover:bg-teal-50 border border-gray-200 hover:border-teal-300 rounded-xl p-4 text-center transition-colors"
          >
            <div className="text-2xl mb-1">{l.emoji}</div>
            <div className="text-sm font-medium text-gray-700">{l.label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
