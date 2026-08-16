'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

const CarteMap = dynamic(() => import('@/components/CarteMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-sky-50 text-sky-400">
      <div className="text-center">
        <div className="text-4xl mb-2">🗺️</div>
        <p className="text-sm font-semibold">Chargement de la carte...</p>
      </div>
    </div>
  ),
})

const ETAPES = [
  { emoji: '🌺', nom: 'Tahiti',     dates: '4 → 7 sept.',      nuits: 3,  slug: 'tahiti' },
  { emoji: '🐋', nom: 'Moorea',     dates: '7 → 14 sept.',     nuits: 7,  slug: 'moorea' },
  { emoji: '🌸', nom: "Taha'a",     dates: '14 → 19 sept.',    nuits: 5,  slug: 'tahaa' },
  { emoji: '🤿', nom: 'Maupiti',    dates: '19 → 22 sept.',    nuits: 3,  slug: 'maupiti' },
  { emoji: '🏝️', nom: 'Bora Bora',  dates: '22 → 29 sept.',    nuits: 7,  slug: 'bora-bora' },
  { emoji: '🌺', nom: 'Tahiti',     dates: '29 sept. → 2 oct.',nuits: 3,  slug: 'tahiti' },
]

export default function CartePage() {
  return (
    <div>
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Carte</h1>
        <p className="text-slate-400 text-sm mt-0.5">Itinéraire interactif · Polynésie française</p>
      </div>

      {/* Carte plein largeur */}
      <div className="px-5 mb-4">
        <div className="h-[380px] rounded-2xl overflow-hidden shadow-md border border-slate-100">
          <CarteMap />
        </div>
      </div>

      {/* Étapes — scroll horizontal */}
      <div className="px-5 mb-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Itinéraire</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {ETAPES.map((e, i) => (
            <div key={i} className="flex items-center gap-1 flex-shrink-0">
              <Link
                href={`/iles/${e.slug}`}
                className="flex flex-col items-center gap-1 bg-white border border-slate-100 hover:border-sky-300 rounded-2xl px-4 py-3 shadow-sm transition-all active:scale-95"
              >
                <span className="text-xl">{e.emoji}</span>
                <span className="font-bold text-slate-800 text-xs text-center whitespace-nowrap">{e.nom}</span>
                <span className="text-slate-400 text-[10px] text-center whitespace-nowrap">{e.dates}</span>
                <span className="text-sky-500 text-[10px] font-semibold">{e.nuits}n</span>
              </Link>
              {i < ETAPES.length - 1 && <span className="text-slate-200 text-base">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="mx-5 mb-4 bg-sky-50 border border-sky-100 rounded-2xl p-4 text-sm text-sky-700">
        <strong>💡 Astuce :</strong> Clique sur les marqueurs pour voir les dates. Clique sur les îles pour accéder à leur page.
      </div>
    </div>
  )
}
