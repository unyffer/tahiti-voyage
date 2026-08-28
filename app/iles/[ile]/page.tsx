export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { ILES } from '@/lib/constants'
import { isUrl, euros } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ExternalLink } from 'lucide-react'

const ILE_SEARCH: Record<string, string[]> = {
  tahiti:       ['Tahiti'],
  moorea:       ['Moorea'],
  tahaa:        ['Tahaa', "Taha'a", 'Raiatea'],
  maupiti:      ['Maupiti'],
  'bora-bora':  ['Bora Bora', 'Bora bora', 'Bora-Bora'],
}

const ILE_GRADIENTS: Record<string, string> = {
  tahiti:       'from-emerald-700 to-emerald-500',
  moorea:       'from-teal-700 to-teal-500',
  tahaa:        'from-pink-700 to-pink-500',
  maupiti:      'from-blue-700 to-blue-500',
  'bora-bora':  'from-cyan-700 to-cyan-500',
}

export default async function IlePage({ params }: { params: Promise<{ ile: string }> }) {
  const { ile: slug } = await params
  const ileDef = ILES.find((i) => i.slug === slug)
  if (!ileDef) notFound()

  const termes = ILE_SEARCH[slug] ?? [ileDef.nom]
  const esc = (s: string) => s.replace(/'/g, "''")
  const filtreLog = termes.map(t => `ile.ilike.%${esc(t)}%`).join(',')
  const filtreAct = termes.map(t => `ile.ilike.%${esc(t)}%`).join(',')
  const filtrePlan = termes.map(t => `lieu.ilike.%${esc(t)}%`).join(',')

  const [logRes, actRes, planRes] = await Promise.all([
    supabase.from('logements').select('*').or(filtreLog),
    supabase.from('activites').select('*').or(filtreAct).order('categorie'),
    supabase.from('planning').select('*').or(filtrePlan).order('sort_order', { ascending: true, nullsFirst: false }),
  ])

  const logements = logRes.data ?? []
  const activites = actRes.data ?? []
  const planning = planRes.data ?? []

  const activitesList = activites.filter(a => a.categorie === 'activite')
  const bouffe = activites.filter(a => a.categorie === 'bouffe')
  const transports = activites.filter(a => a.categorie === 'transport')

  const totalNuits = planning.filter(p => p.type === 'sejour').reduce((s, p) => s + (p.nuits ?? 0), 0)

  function formatDate(d: string) {
    try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) }
    catch { return d }
  }

  const dates = planning
    .filter(p => p.type === 'sejour')
    .map(p => `${formatDate(p.date_debut)} → ${formatDate(p.date_fin)}`)
    .join(' / ')

  const gradient = ILE_GRADIENTS[slug] ?? 'from-sky-700 to-sky-500'

  return (
    <div>
      {/* ── HERO île ── */}
      <div className={`relative bg-gradient-to-br ${gradient} px-5 pt-12 pb-10`}>
        <Link href="/planning" className="flex items-center gap-1 text-white/70 text-sm font-semibold mb-4 hover:text-white">
          <ChevronLeft size={16} /> Planning
        </Link>
        <div className="text-5xl mb-3">{ileDef.emoji}</div>
        <h1 className="text-4xl font-black text-white leading-tight">{ileDef.nom}</h1>
        {dates && <p className="text-white/80 mt-1 text-base">{dates}</p>}
        {totalNuits > 0 && (
          <p className="text-white/60 text-sm mt-0.5">{totalNuits} nuit{totalNuits > 1 ? 's' : ''}</p>
        )}
        {/* Wave */}
        <svg className="absolute bottom-0 inset-x-0 w-full" viewBox="0 0 1440 30" preserveAspectRatio="none">
          <path d="M0,10 C480,30 960,0 1440,15 L1440,30 L0,30 Z" fill="white" />
        </svg>
      </div>

      {/* Nav îles — scroll horizontal */}
      <div className="flex gap-2 px-5 py-4 overflow-x-auto no-scrollbar">
        {ILES.map(i => (
          <Link
            key={i.slug}
            href={`/iles/${i.slug}`}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
              i.slug === slug
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-slate-500 border-slate-200 hover:border-sky-300'
            }`}
          >
            {i.emoji} {i.nom}
          </Link>
        ))}
      </div>

      <div className="px-5 pb-8 space-y-5">
        {/* ── Logement ── */}
        {logements.length > 0 && (
          <section>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🏠 Logement</p>
            {logements.map(l => (
              <div key={l.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                {l.periode && <p className="text-sm text-slate-500">{l.periode}</p>}
                {isUrl(l.lien_annonce) && (
                  <a href={l.lien_annonce!} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sky-600 font-semibold text-sm bg-sky-50 border border-sky-100 rounded-xl px-3 py-2 hover:bg-sky-100 transition-colors">
                    <ExternalLink size={14} /> Voir l&apos;annonce
                  </a>
                )}
                {l.commentaires && (
                  <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-sm text-sky-800">
                    💬 {l.commentaires}
                  </div>
                )}
                {l.questions && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-800">
                    ❓ {l.questions}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {/* ── Activités ── */}
        {activitesList.length > 0 && (
          <section>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🎯 Activités</p>
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
              {activitesList.map(a => (
                <div key={a.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">{a.nom}</span>
                        {a.statut === 'paye' && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">✅ Payé</span>
                        )}
                        {a.statut === 'reserve' && (
                          <span className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-semibold">📋 Réservé</span>
                        )}
                        {a.gratuit && (
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Gratuit</span>
                        )}
                      </div>
                      {/* Infos pratiques */}
                      {(a.date_heure || a.lieu || a.contact) && (
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          {a.date_heure && <span className="text-xs text-sky-600 font-medium">📅 {a.date_heure}</span>}
                          {a.lieu       && <span className="text-xs text-emerald-600 font-medium">📍 {a.lieu}</span>}
                          {a.contact    && <span className="text-xs text-violet-600 font-medium">👤 {a.contact}</span>}
                        </div>
                      )}
                      {a.commentaire && <p className="text-xs text-slate-500 mt-0.5">{a.commentaire}</p>}
                      {a.lien && (
                        <a href={a.lien} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-sky-600 hover:underline mt-0.5 inline-block">🔗 Lien</a>
                      )}
                    </div>
                    {a.prix && <span className="font-bold text-slate-800 text-sm flex-shrink-0">{euros(a.prix)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Transports locaux ── */}
        {transports.length > 0 && (
          <section>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🚗 Transports locaux</p>
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
              {transports.map(t => (
                <div key={t.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-sm">{t.nom}</p>
                    {t.commentaire && <p className="text-xs text-slate-500 mt-0.5">{t.commentaire}</p>}
                  </div>
                  {t.prix && <span className="font-bold text-slate-800 text-sm flex-shrink-0">{euros(t.prix)}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Nourriture ── */}
        {bouffe.length > 0 && (
          <section>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🍴 Nourriture & snacks</p>
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
              {bouffe.map(b => (
                <div key={b.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 text-sm">{b.nom}</p>
                        {b.statut === 'reserve' && (
                          <span className="text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full font-semibold">📋 Réservé</span>
                        )}
                        {b.statut === 'paye' && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">✅ Payé</span>
                        )}
                      </div>
                      {(b.date_heure || b.lieu || b.contact) && (
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          {b.date_heure && <span className="text-xs text-sky-600 font-medium">📅 {b.date_heure}</span>}
                          {b.lieu       && <span className="text-xs text-emerald-600 font-medium">📍 {b.lieu}</span>}
                          {b.contact    && <span className="text-xs text-violet-600 font-medium">👤 {b.contact}</span>}
                        </div>
                      )}
                      {b.commentaire && <p className="text-xs text-slate-500 mt-0.5">{b.commentaire}</p>}
                    </div>
                    {b.prix && <span className="font-bold text-orange-600 text-sm flex-shrink-0">{euros(b.prix)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {logements.length === 0 && activites.length === 0 && (
          <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center text-slate-400 shadow-sm">
            <p className="text-4xl mb-3">🌊</p>
            <p className="font-semibold text-slate-500">Pas encore de données</p>
            <p className="text-sm mt-1">
              Ajoute des activités depuis{' '}
              <Link href="/activites" className="text-sky-600 hover:underline">Activités</Link>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
