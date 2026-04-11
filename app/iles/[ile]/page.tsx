export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { ILES } from '@/lib/constants'
import { isUrl, euros } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'

// Tous les termes qui correspondent à chaque slug dans la base de données
const ILE_SEARCH: Record<string, string[]> = {
  tahiti:     ['Tahiti'],
  moorea:     ['Moorea'],
  tahaa:      ['Tahaa', "Taha'a", 'Tahaa', 'Raiatea'],
  maupiti:    ['Maupiti'],
  'bora-bora':['Bora Bora', 'Bora bora', 'Bora-Bora'],
}

export default async function IlePage({ params }: { params: Promise<{ ile: string }> }) {
  const { ile: slug } = await params
  const ileDef = ILES.find((i) => i.slug === slug)
  if (!ileDef) notFound()

  const termes = ILE_SEARCH[slug] ?? [ileDef.nom]

  // Requête pour chaque terme possible et fusionner les résultats
  const [logRes, actRes, planRes] = await Promise.all([
    supabase.from('logements').select('*').or(termes.map(t => `ile.ilike.%${t}%`).join(',')),
    supabase.from('activites').select('*').or(termes.map(t => `ile.ilike.%${t}%`).join(',')).order('categorie'),
    supabase.from('planning').select('*').or(termes.map(t => `lieu.ilike.%${t}%`).join(','))
      .order('sort_order', { ascending: true, nullsFirst: false }),
  ])

  const logements = logRes.data ?? []
  const activites = actRes.data ?? []
  const planning = planRes.data ?? []

  const activitesList = activites.filter((a) => a.categorie === 'activite')
  const bouffe = activites.filter((a) => a.categorie === 'bouffe')
  const transports = activites.filter((a) => a.categorie === 'transport')

  const totalNuits = planning.filter(p => p.type === 'sejour').reduce((s, p) => s + (p.nuits ?? 0), 0)

  function formatDate(d: string) {
    try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) }
    catch { return d }
  }

  const dates = planning
    .filter(p => p.type === 'sejour')
    .map(p => `${formatDate(p.date_debut)} → ${formatDate(p.date_fin)}`)
    .join(' / ')

  return (
    <div className="space-y-6">
      {/* Header île */}
      <div className={`${ileDef.couleur} text-white rounded-2xl p-6`}>
        <div className="text-4xl mb-2">{ileDef.emoji}</div>
        <h1 className="text-3xl font-bold">{ileDef.nom}</h1>
        {dates && <p className="text-white/80 mt-1">{dates}</p>}
        {totalNuits > 0 && <p className="text-white/80">{totalNuits} nuit{totalNuits > 1 ? 's' : ''}</p>}
      </div>

      {/* Nav entre îles */}
      <div className="flex flex-wrap gap-2">
        {ILES.map((i) => (
          <Link key={i.slug} href={`/iles/${i.slug}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              i.slug === slug
                ? 'bg-teal-700 text-white border-teal-700'
                : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
            }`}
          >
            {i.emoji} {i.nom}
          </Link>
        ))}
      </div>

      {/* Logement */}
      {logements.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">🏠 Logement</h2>
          {logements.map((l) => (
            <div key={l.id} className="space-y-2">
              <p className="text-sm text-gray-500">{l.periode}</p>
              {isUrl(l.lien_annonce) && (
                <a href={l.lien_annonce!} target="_blank" rel="noopener noreferrer"
                  className="text-teal-600 hover:text-teal-700 font-medium text-sm block">
                  🔗 Voir l&apos;annonce
                </a>
              )}
              {l.commentaires && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  💬 {l.commentaires}
                </div>
              )}
              {l.questions && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  ❓ {l.questions}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Activités */}
      {activitesList.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">🎯 Activités</h2>
          <div className="space-y-2">
            {activitesList.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-800">{a.nom}</span>
                    {a.statut === 'paye' && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✅ Payé</span>}
                    {a.gratuit && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Gratuit</span>}
                  </div>
                  {a.commentaire && <p className="text-sm text-gray-500 mt-0.5">{a.commentaire}</p>}
                  {a.lien && <a href={a.lien} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline">🔗 Lien</a>}
                </div>
                {a.prix && <span className="font-semibold text-gray-800 whitespace-nowrap">{euros(a.prix)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transports locaux */}
      {transports.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">🚗 Transports</h2>
          <div className="space-y-2">
            {transports.map((t) => (
              <div key={t.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-gray-50">
                <div>
                  <p className="font-medium text-gray-800">{t.nom}</p>
                  {t.commentaire && <p className="text-sm text-gray-500">{t.commentaire}</p>}
                </div>
                {t.prix && <span className="font-semibold text-gray-700">{euros(t.prix)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bouffe */}
      {bouffe.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">🍴 Bouffe & snacks</h2>
          <div className="space-y-2">
            {bouffe.map((b) => (
              <div key={b.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-orange-50">
                <div>
                  <p className="font-medium text-gray-800">{b.nom}</p>
                  {b.commentaire && <p className="text-sm text-gray-500">{b.commentaire}</p>}
                </div>
                {b.prix && <span className="font-semibold text-orange-700">{euros(b.prix)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {logements.length === 0 && activites.length === 0 && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center text-gray-400">
          <p className="text-4xl mb-2">🌊</p>
          <p>Pas encore de données pour cette île.</p>
          <p className="text-sm mt-1">Ajoute des activités depuis la page <Link href="/activites" className="text-teal-600 hover:underline">Activités</Link>.</p>
        </div>
      )}
    </div>
  )
}
