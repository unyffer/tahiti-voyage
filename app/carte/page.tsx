'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

// Chargement dynamique obligatoire pour Leaflet (pas de SSR)
const CarteMap = dynamic(() => import('@/components/CarteMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-teal-50 rounded-xl text-teal-600">
      <div className="text-center">
        <div className="text-4xl mb-2">🗺️</div>
        <p>Chargement de la carte...</p>
      </div>
    </div>
  ),
})

const ETAPES = [
  { emoji: '🌺', nom: 'Tahiti', dates: '4 → 7 sept.', nuits: 3, slug: 'tahiti' },
  { emoji: '🐋', nom: 'Moorea', dates: '7 → 14 sept.', nuits: 7, slug: 'moorea' },
  { emoji: '🌸', nom: "Taha'a", dates: '14 → 19 sept.', nuits: 5, slug: 'tahaa' },
  { emoji: '🤿', nom: 'Maupiti', dates: '19 → 22 sept.', nuits: 3, slug: 'maupiti' },
  { emoji: '🏝️', nom: 'Bora Bora', dates: '22 → 29 sept.', nuits: 7, slug: 'bora-bora' },
  { emoji: '🌺', nom: 'Tahiti', dates: '29 sept. → 2 oct.', nuits: 3, slug: 'tahiti' },
]

export default function CartePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">🗺️ Carte du voyage</h1>
        <p className="text-gray-500 mt-1">Itinéraire interactif · 4 sept. → 2 oct. 2026 · Polynésie française</p>
      </div>

      {/* Carte */}
      <div style={{ height: '500px' }} className="rounded-xl overflow-hidden shadow-lg border border-gray-200">
        <CarteMap />
      </div>

      {/* Légende / étapes en dessous */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Itinéraire — clique sur les marqueurs pour les détails</h2>
        <div className="flex flex-wrap gap-3">
          {ETAPES.map((e, i) => (
            <div key={i} className="flex items-center gap-1">
              <Link
                href={`/iles/${e.slug}`}
                className="flex items-center gap-2 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-2 rounded-lg transition-colors"
              >
                <span className="text-lg">{e.emoji}</span>
                <div>
                  <div className="font-semibold text-teal-800 text-sm">{e.nom}</div>
                  <div className="text-xs text-teal-600">{e.dates} · {e.nuits}n</div>
                </div>
              </Link>
              {i < ETAPES.length - 1 && <span className="text-gray-300 text-lg">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-800">
        <strong>Astuce :</strong> Clique sur chaque marqueur de la carte pour voir les dates et la durée du séjour.
        Clique sur les îles dans la légende pour aller directement à la page de l&apos;île.
      </div>
    </div>
  )
}
