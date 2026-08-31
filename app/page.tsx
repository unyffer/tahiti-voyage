export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'
import { ILES, BUDGET_TOTAL } from '@/lib/constants'
import Link from 'next/link'
import CountdownHero from '@/components/CountdownHero'
import { ChevronRight } from 'lucide-react'

function euros(n: number | null | undefined) {
  if (n == null) return '–'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) }
  catch { return d }
}

export default async function HomePage() {
  const [{ data: planning }, { data: paiementsLog }, { data: paiementsAutres }] = await Promise.all([
    supabase.from('planning').select('*').order('sort_order', { ascending: true, nullsFirst: false }),
    supabase.from('paiements_logements').select('*'),
    supabase.from('paiements_autres').select('*'),
  ])

  const totalResteLog = paiementsLog?.reduce((s, r) => s + (r.reste_a_payer ?? 0), 0) ?? 0
  const totalResteAutres = paiementsAutres?.reduce((s, r) => s + ((r.reste_par_personne ?? 0) * 3), 0) ?? 0
  const totalReste = totalResteLog + totalResteAutres
  const dejaRegle = BUDGET_TOTAL - totalReste
  const pct = BUDGET_TOTAL > 0 ? Math.round((dejaRegle / BUDGET_TOTAL) * 100) : 0

  const prochainPaiement = paiementsLog
    ?.filter(r => r.reste_a_payer && r.reste_a_payer > 0 && r.date_echeance)
    .sort((a, b) => (a.date_echeance! > b.date_echeance! ? 1 : -1))[0]

  const sejours = planning?.filter(p => p.type === 'sejour') ?? []
  const now = new Date()
  const prochaineEtape = sejours.find(s => new Date(s.date_debut) > now) ?? sejours[0]

  // Île correspondant à la prochaine étape
  const getIleDef = (lieu: string) =>
    ILES.find(i => lieu?.toLowerCase().includes(i.nom.toLowerCase()))

  return (
    <div className="flex flex-col">
      {/* ── HERO ── */}
      <div className="relative min-h-[55vh] flex flex-col justify-end overflow-hidden">
        {/* Gradient lagon */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(160deg, #0c4a6e 0%, #0284c7 35%, #06b6d4 65%, #059669 100%)',
          }}
        />
        {/* Motif vague */}
        <svg className="absolute bottom-0 inset-x-0 w-full" viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="white" />
        </svg>

        {/* Contenu hero */}
        <div className="relative z-10 px-5 pb-14 pt-12">
          <p className="text-sky-200 text-sm font-semibold tracking-widest uppercase mb-2">4 sept → 2 oct 2026</p>
          <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
            Tahiti 2026
          </h1>
          <p className="text-white/60 text-base mt-1">Régis · Isa · Agathe · 28 nuits</p>
          <CountdownHero />
        </div>
      </div>

      {/* ── ÎLES ── */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {ILES.map(ile => (
            <Link
              key={ile.slug}
              href={`/iles/${ile.slug}`}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-50 hover:bg-sky-50 active:scale-95 transition-all border border-slate-100"
            >
              <span className="text-2xl">{ile.emoji}</span>
              <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">{ile.nom}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── PROCHAINE ÉTAPE ── */}
      {prochaineEtape && (() => {
        const ileDef = getIleDef(prochaineEtape.lieu)
        return (
          <div className="px-5 mt-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Prochaine étape</p>
            <Link href={ileDef ? `/iles/${ileDef.slug}` : '/planning'}>
              <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow active:scale-[.99]">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${ileDef?.couleur ?? 'bg-sky-500'}`}>
                    {ileDef?.emoji ?? '📍'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{prochaineEtape.lieu}</p>
                    <p className="text-sm text-slate-500">
                      {formatDate(prochaineEtape.date_debut)} → {formatDate(prochaineEtape.date_fin)}
                      {prochaineEtape.nuits ? ` · ${prochaineEtape.nuits}n` : ''}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </div>
            </Link>
          </div>
        )
      })()}

      {/* ── AVANCEMENT BUDGET ── */}
      <div className="px-5 mt-5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Budget</p>
        <Link href="/paiements">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow active:scale-[.99]">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-sm font-semibold text-slate-700">{pct}% réglé</span>
              <span className="text-sm text-slate-400">{euros(dejaRegle)} / {euros(BUDGET_TOTAL)}</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span className="text-emerald-600 font-semibold">{euros(dejaRegle)} réglé</span>
              <span className="text-orange-500 font-semibold">{euros(totalReste)} restant</span>
            </div>
          </div>
        </Link>
      </div>

      {/* ── PROCHAIN PAIEMENT ── */}
      {prochainPaiement && (
        <div className="px-5 mt-5 mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">À régler bientôt</p>
          <Link href="/paiements">
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center justify-between active:scale-[.99]">
              <div>
                <p className="font-semibold text-slate-900 text-sm">{prochainPaiement.description}</p>
                <p className="text-xs text-orange-500 mt-0.5">⏰ Échéance : {prochainPaiement.date_echeance}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-orange-600 text-lg">{euros(prochainPaiement.reste_a_payer)}</p>
                <p className="text-xs text-orange-400">~{euros(Math.round((prochainPaiement.reste_a_payer ?? 0) / 3))}/pers</p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ── LIENS RAPIDES ── */}
      <div className="px-5 mt-2 mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Accès rapide</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: '/planning', emoji: '📅', label: 'Planning' },
            { href: '/checklist', emoji: '✅', label: 'Checklist' },
            { href: '/activites', emoji: '🎯', label: 'Activités' },
            { href: '/vols', emoji: '✈️', label: 'Vols' },
          ].map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center gap-3 bg-slate-50 hover:bg-sky-50 border border-slate-100 rounded-2xl px-4 py-3 transition-all active:scale-95"
            >
              <span className="text-xl">{l.emoji}</span>
              <span className="text-sm font-semibold text-slate-700">{l.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
