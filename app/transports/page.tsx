export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'

function euros(n: number | null | undefined) {
  if (n == null) return '–'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

export default async function TransportsPage() {
  const [{ data: transports }, { data: voitures }] = await Promise.all([
    supabase.from('activites').select('*').eq('categorie', 'transport').order('ile'),
    supabase.from('voitures').select('*').order('id'),
  ])

  // Avions depuis les données
  const avions = transports?.filter((t) => t.nom?.toLowerCase().includes('avion') || t.nom?.toLowerCase().includes('vol') || t.nom?.toLowerCase().includes('pass')) ?? []
  const ferries = transports?.filter((t) => t.nom?.toLowerCase().includes('ferry') || t.nom?.toLowerCase().includes('bateau') || t.nom?.toLowerCase().includes('express')) ?? []
  const autresTransports = transports?.filter((t) =>
    !avions.includes(t) && !ferries.includes(t)
  ) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">✈️ Transports</h1>
        <p className="text-gray-500 mt-1">Avions, ferries et voitures de location</p>
      </div>

      {/* Avions */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="bg-sky-600 text-white px-5 py-3 rounded-t-xl">
          <h2 className="font-semibold text-lg">✈️ Avions</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {/* Vol Paris ↔ Papeete — données statiques du fichier activites */}
          <div className="px-5 py-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-gray-800">Paris → Papeete (ATN)</p>
              <p className="text-sm text-gray-500">Aller-retour · 3 personnes</p>
            </div>
            <span className="font-bold text-gray-800">{euros(6000)}</span>
          </div>
          <div className="px-5 py-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-gray-800">Pass inter-îles (haute saison)</p>
              <p className="text-sm text-gray-500">585 € × 3 personnes · Papeete → Tahaa → Maupiti → Bora Bora → Papeete</p>
              <p className="text-sm text-orange-600">⚠️ Attention horaires mouvants — vérifier escales</p>
            </div>
            <span className="font-bold text-gray-800">{euros(1860)}</span>
          </div>
          {avions.map((t) => (
            <div key={t.id} className="px-5 py-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-800">{t.nom}</p>
                {t.commentaire && <p className="text-sm text-gray-500">{t.commentaire}</p>}
              </div>
              {t.prix && <span className="font-bold text-gray-800">{euros(t.prix)}</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Ferries */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="bg-blue-600 text-white px-5 py-3 rounded-t-xl">
          <h2 className="font-semibold text-lg">🚢 Ferries</h2>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="px-5 py-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-gray-800">Ferry Tahiti → Moorea</p>
              <p className="text-sm text-gray-500">32 € / pers · déjà payé par Régis</p>
            </div>
            <span className="font-bold text-emerald-600">✅ {euros(96)}</span>
          </div>
          <div className="px-5 py-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-gray-800">Maupiti Express (Bora ↔ Maupiti)</p>
              <p className="text-sm text-gray-500">Départ Bora le mardi, retour le jeudi</p>
            </div>
            <span className="font-bold text-gray-800">{euros(50)}</span>
          </div>
          {ferries.map((t) => (
            <div key={t.id} className="px-5 py-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-800">{t.nom}</p>
                {t.commentaire && <p className="text-sm text-gray-500">{t.commentaire}</p>}
              </div>
              {t.prix && <span className="font-bold text-gray-800">{euros(t.prix)}</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Voitures */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="bg-amber-600 text-white px-5 py-3 rounded-t-xl">
          <h2 className="font-semibold text-lg">🚗 Voitures de location</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {/* Données statiques */}
          <div className="px-5 py-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-gray-800">Tahiti — Location Papeete Faaa</p>
              <p className="text-sm text-gray-500">~50 €/j × 3 jours · début de séjour</p>
              <p className="text-sm text-orange-600 font-medium">❌ Personne n&apos;a payé</p>
            </div>
            <span className="font-bold text-orange-600">{euros(180)}</span>
          </div>
          <div className="px-5 py-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-gray-800">Moorea — Location voiture</p>
              <p className="text-sm text-gray-500">Au port · 10 jours</p>
              <p className="text-sm text-orange-600 font-medium">❌ Personne n&apos;a payé</p>
            </div>
            <span className="font-bold text-orange-600">{euros(550)}</span>
          </div>
          <div className="px-5 py-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-gray-800">Bora Bora — Location voiture</p>
              <p className="text-sm text-gray-500">25/09 → 29/09 · AVIS</p>
              <p className="text-sm text-orange-600 font-medium">⚠️ À confirmer</p>
            </div>
            <span className="font-bold text-gray-700">{euros(285)}</span>
          </div>
          <div className="px-5 py-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-gray-800">Tahiti fin — Location voiture</p>
              <p className="text-sm text-gray-500">3 jours · fin de séjour</p>
              <p className="text-sm text-orange-600 font-medium">❌ Personne n&apos;a payé</p>
            </div>
            <span className="font-bold text-orange-600">{euros(339)}</span>
          </div>
          {voitures?.map((v) => (
            <div key={v.id} className="px-5 py-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-gray-800">{v.ile} — {v.agence ?? 'À définir'}</p>
                {v.periode && <p className="text-sm text-gray-500">{v.periode}</p>}
                {v.commentaire && <p className="text-sm text-gray-500">{v.commentaire}</p>}
                {v.statut && <p className="text-sm text-orange-500">{v.statut}</p>}
              </div>
              {v.prix && <span className="font-bold text-gray-800">{euros(v.prix)}</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Taxi */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="bg-yellow-500 text-white px-5 py-3 rounded-t-xl">
          <h2 className="font-semibold text-lg">🚕 Taxis</h2>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-800">Taxi Moorea</p>
            <span className="font-bold text-gray-800">{euros(25)}</span>
          </div>
        </div>
      </section>
    </div>
  )
}
