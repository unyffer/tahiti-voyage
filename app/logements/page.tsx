'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import Modal from '@/components/Modal'
import FormField from '@/components/FormField'
import { ILES } from '@/lib/constants'

interface Logement { id: number; ile: string; periode: string; lien_annonce: string | null; commentaires: string | null; questions: string | null }
interface PaiementLog { id: number; description: string; regis: number | null; isa: number | null; agathe: number | null; total: number | null; date_echeance: string | null; reste_a_payer: number | null; lien_reservation: string | null }

function euros(n: number | null | undefined) {
  if (n == null) return '–'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

const VIDE: Omit<Logement, 'id'> = { ile: 'Tahiti', periode: '', lien_annonce: null, commentaires: null, questions: null }

export default function LogementsPage() {
  const [logements, setLogements] = useState<Logement[]>([])
  const [paiements, setPaiements] = useState<PaiementLog[]>([])
  const [chargement, setChargement] = useState(true)
  const [modal, setModal] = useState<Partial<Logement> | null>(null)
  const [sauvegarde, setSauvegarde] = useState(false)

  const charger = useCallback(async () => {
    const [l, p] = await Promise.all([
      fetch('/api/logements').then(r => r.json()),
      fetch('/api/paiements-logements').then(r => r.json()),
    ])
    setLogements(l ?? [])
    setPaiements(p ?? [])
    setChargement(false)
  }, [])

  useEffect(() => { charger() }, [charger])

  async function sauvegarder(e: React.FormEvent) {
    e.preventDefault()
    setSauvegarde(true)
    const method = modal?.id ? 'PATCH' : 'POST'
    await fetch('/api/logements', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(modal) })
    setModal(null)
    await charger()
    setSauvegarde(false)
  }

  async function supprimer(id: number) {
    if (!confirm('Supprimer ce logement ?')) return
    await fetch(`/api/logements?id=${id}`, { method: 'DELETE' })
    await charger()
  }

  if (chargement) return <div className="flex items-center justify-center h-48 text-gray-400">Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🏠 Logements</h1>
          <p className="text-gray-500 mt-1">Vue consolidée de tous les hébergements</p>
        </div>
        <button onClick={() => setModal({ ...VIDE })} className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
          + Ajouter
        </button>
      </div>

      {/* Tableau paiements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Logement</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Période</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Total</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Reste</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Échéance</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Lien</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paiements.map((p) => {
                const log = logements.find(l => l.ile?.toLowerCase().includes(p.description?.split(' ')[0]?.toLowerCase() ?? ''))
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.description}</td>
                    <td className="px-4 py-3 text-gray-600">{log?.periode ?? '–'}</td>
                    <td className="px-4 py-3 font-semibold">{euros(p.total)}</td>
                    <td className="px-4 py-3">
                      {p.reste_a_payer && p.reste_a_payer > 0
                        ? <span className="text-orange-600 font-semibold">{euros(p.reste_a_payer)}</span>
                        : <span className="text-emerald-600 font-semibold">✅ Soldé</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.date_echeance ?? '–'}</td>
                    <td className="px-4 py-3">
                      {p.lien_reservation
                        ? <a href={p.lien_reservation} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 font-medium">🔗 Résa</a>
                        : log?.lien_annonce
                        ? <a href={log.lien_annonce} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 font-medium">🔗 Annonce</a>
                        : '–'}
                    </td>
                    <td className="px-4 py-3"></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards logements avec commentaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {logements.map((l) => (
          <div key={l.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">
                  {ILES.find(i => l.ile?.toLowerCase().includes(i.nom.toLowerCase()))?.emoji ?? '🏠'} {l.ile}
                </h3>
                <p className="text-sm text-gray-500">{l.periode}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setModal(l)} className="text-teal-600 hover:text-teal-700 p-1" title="Modifier">✏️</button>
                <button onClick={() => supprimer(l.id)} className="text-red-400 hover:text-red-600 p-1" title="Supprimer">🗑️</button>
              </div>
            </div>
            {l.lien_annonce && (
              <a href={l.lien_annonce} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 text-sm font-medium block mb-2">
                🔗 Voir l&apos;annonce
              </a>
            )}
            {l.commentaires && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 mb-2">💬 {l.commentaires}</div>
            )}
            {l.questions && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">❓ {l.questions}</div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal && (
        <Modal titre={modal.id ? 'Modifier le logement' : 'Ajouter un logement'} onClose={() => setModal(null)}>
          <form onSubmit={sauvegarder} className="space-y-4">
            <FormField label="Île" name="ile" type="select" value={modal.ile} onChange={(v) => setModal(p => ({ ...p, ile: v }))}
              options={ILES.map(i => ({ value: i.nom, label: `${i.emoji} ${i.nom}` }))} required />
            <FormField label="Période" name="periode" value={modal.periode} onChange={(v) => setModal(p => ({ ...p, periode: v }))} placeholder="ex: 07/09 - 14/09" required />
            <FormField label="Lien annonce (Airbnb/Booking...)" name="lien_annonce" type="url" value={modal.lien_annonce ?? ''} onChange={(v) => setModal(p => ({ ...p, lien_annonce: v || null }))} />
            <FormField label="Commentaires" name="commentaires" type="textarea" value={modal.commentaires ?? ''} onChange={(v) => setModal(p => ({ ...p, commentaires: v || null }))} placeholder="Infos pratiques, noter les particularités..." />
            <FormField label="Questions ouvertes" name="questions" type="textarea" value={modal.questions ?? ''} onChange={(v) => setModal(p => ({ ...p, questions: v || null }))} placeholder="Ce qu'on doit encore clarifier..." />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
              <button type="submit" disabled={sauvegarde} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                {sauvegarde ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
