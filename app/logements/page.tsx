'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import Modal from '@/components/Modal'
import FormField from '@/components/FormField'
import { ILES } from '@/lib/constants'
import { isUrl } from '@/lib/utils'

interface Logement { id: number; ile: string; periode: string; lien_annonce: string | null; commentaires: string | null; questions: string | null }
interface PaiementLog { id: number; description: string; regis: number | null; isa: number | null; agathe: number | null; total: number | null; date_echeance: string | null; reste_a_payer: number | null; lien_reservation: string | null }

function euros(n: number | null | undefined) {
  if (n == null) return '–'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

const LOG_VIDE: Omit<Logement, 'id'> = { ile: 'Tahiti', periode: '', lien_annonce: null, commentaires: null, questions: null }
const PAI_VIDE: Omit<PaiementLog, 'id'> = { description: '', regis: null, isa: null, agathe: null, total: null, date_echeance: null, reste_a_payer: null, lien_reservation: null }

function getEmoji(ile: string) {
  return ILES.find(i => ile?.toLowerCase().includes(i.nom.toLowerCase()))?.emoji ?? '🏠'
}

export default function LogementsPage() {
  const [logements, setLogements] = useState<Logement[]>([])
  const [paiements, setPaiements] = useState<PaiementLog[]>([])
  const [chargement, setChargement] = useState(true)
  const [modalLog, setModalLog] = useState<Partial<Logement> | null>(null)
  const [modalPai, setModalPai] = useState<Partial<PaiementLog> | null>(null)
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

  async function sauvegarderLog(e: React.FormEvent) {
    e.preventDefault(); setSauvegarde(true)
    await fetch('/api/logements', { method: modalLog?.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(modalLog) })
    setModalLog(null); await charger(); setSauvegarde(false)
  }

  async function sauvegarderPai(e: React.FormEvent) {
    e.preventDefault(); setSauvegarde(true)
    await fetch('/api/paiements-logements', { method: modalPai?.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(modalPai) })
    setModalPai(null); await charger(); setSauvegarde(false)
  }

  async function supprimerLog(id: number) {
    if (!confirm('Supprimer ce logement ?')) return
    await fetch(`/api/logements?id=${id}`, { method: 'DELETE' }); await charger()
  }

  async function supprimerPai(id: number) {
    if (!confirm('Supprimer cette ligne ?')) return
    await fetch(`/api/paiements-logements?id=${id}`, { method: 'DELETE' }); await charger()
  }

  if (chargement) return <div className="flex items-center justify-center h-48 text-gray-400">Chargement...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">🏠 Logements</h1>
        <p className="text-gray-500 mt-1">Hébergements et suivi des paiements</p>
      </div>

      {/* Vue consolidée des paiements — entièrement éditable */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-teal-700 text-white px-5 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-lg">💰 Vue consolidée des paiements</h2>
          <button onClick={() => setModalPai({ ...PAI_VIDE })} className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1 rounded-lg transition-colors">
            + Ajouter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Logement</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Régis</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Isa</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Agathe</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Total</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Reste</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Échéance</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Lien</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paiements.map((p) => {
                const log = logements.find(l => l.ile?.toLowerCase().includes(p.description?.split(' ')[0]?.toLowerCase() ?? ''))
                return (
                  <tr key={p.id} className="hover:bg-gray-50 group">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.description}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{p.regis ? euros(p.regis) : '–'}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{p.isa ? euros(p.isa) : '–'}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{p.agathe ? euros(p.agathe) : '–'}</td>
                    <td className="px-4 py-3 text-right font-semibold">{euros(p.total)}</td>
                    <td className="px-4 py-3">
                      {!p.reste_a_payer || p.reste_a_payer <= 0
                        ? <span className="text-emerald-600 font-semibold text-xs">✅ Soldé</span>
                        : <span className="text-orange-600 font-semibold">{euros(p.reste_a_payer)}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.date_echeance ?? '–'}</td>
                    <td className="px-4 py-3">
                      {(isUrl(p.lien_reservation) || isUrl(log?.lien_annonce)) && (
                        <a href={p.lien_reservation ?? log?.lien_annonce ?? ''} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 font-medium text-xs">🔗</a>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setModalPai(p)} className="text-teal-600 hover:text-teal-700 p-1" title="Modifier">✏️</button>
                        <button onClick={() => supprimerPai(p.id)} className="text-red-400 hover:text-red-600 p-1" title="Supprimer">🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              <tr className="bg-gray-50 font-semibold text-sm">
                <td className="px-4 py-3 text-gray-700">Total</td>
                <td className="px-4 py-3 text-right">{euros(paiements.reduce((s, p) => s + (p.regis ?? 0), 0))}</td>
                <td className="px-4 py-3 text-right">{euros(paiements.reduce((s, p) => s + (p.isa ?? 0), 0))}</td>
                <td className="px-4 py-3 text-right">{euros(paiements.reduce((s, p) => s + (p.agathe ?? 0), 0))}</td>
                <td className="px-4 py-3 text-right">{euros(paiements.reduce((s, p) => s + (p.total ?? 0), 0))}</td>
                <td className="px-4 py-3 text-orange-600">{euros(paiements.reduce((s, p) => s + (p.reste_a_payer ?? 0), 0))} restant</td>
                <td colSpan={3}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards logements avec infos pratiques */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">🗂️ Infos pratiques par hébergement</h2>
        <button onClick={() => setModalLog({ ...LOG_VIDE })} className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
          + Ajouter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {logements.map((l) => (
          <div key={l.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">{getEmoji(l.ile)} {l.ile}</h3>
                <p className="text-sm text-gray-500">{l.periode}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setModalLog(l)} className="text-teal-600 hover:text-teal-700 p-1" title="Modifier">✏️</button>
                <button onClick={() => supprimerLog(l.id)} className="text-red-400 hover:text-red-600 p-1" title="Supprimer">🗑️</button>
              </div>
            </div>
            {isUrl(l.lien_annonce) && (
              <a href={l.lien_annonce!} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 text-sm font-medium block mb-2">
                🔗 Voir l&apos;annonce
              </a>
            )}
            {l.commentaires && <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 mb-2">💬 {l.commentaires}</div>}
            {l.questions && <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">❓ {l.questions}</div>}
            {!l.commentaires && !l.questions && !l.lien_annonce && (
              <p className="text-sm text-gray-400 italic">Aucune info — clique ✏️ pour en ajouter</p>
            )}
          </div>
        ))}
      </div>

      {/* Modal logement (infos pratiques) */}
      {modalLog && (
        <Modal titre={modalLog.id ? 'Modifier les infos pratiques' : 'Ajouter un logement'} onClose={() => setModalLog(null)}>
          <form onSubmit={sauvegarderLog} className="space-y-4">
            <FormField label="Île" name="ile" type="select" value={modalLog.ile} onChange={(v) => setModalLog(p => ({ ...p, ile: v }))}
              options={ILES.map(i => ({ value: i.nom, label: `${i.emoji} ${i.nom}` }))} required />
            <FormField label="Période" name="periode" value={modalLog.periode} onChange={(v) => setModalLog(p => ({ ...p, periode: v }))} placeholder="ex: 07/09 - 14/09" required />
            <FormField label="Lien annonce (Airbnb/Booking...)" name="lien_annonce" type="url" value={modalLog.lien_annonce ?? ''} onChange={(v) => setModalLog(p => ({ ...p, lien_annonce: v || null }))} />
            <FormField label="💬 Commentaires" name="commentaires" type="textarea" value={modalLog.commentaires ?? ''} onChange={(v) => setModalLog(p => ({ ...p, commentaires: v || null }))} placeholder="Infos pratiques (voiture, kayak, petit-déj...)..." />
            <FormField label="❓ Questions ouvertes" name="questions" type="textarea" value={modalLog.questions ?? ''} onChange={(v) => setModalLog(p => ({ ...p, questions: v || null }))} placeholder="Ce qu'on doit encore clarifier..." />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModalLog(null)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
              <button type="submit" disabled={sauvegarde} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">{sauvegarde ? 'Sauvegarde...' : 'Sauvegarder'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal paiement */}
      {modalPai && (
        <Modal titre={modalPai.id ? 'Modifier le paiement' : 'Ajouter un paiement logement'} onClose={() => setModalPai(null)}>
          <form onSubmit={sauvegarderPai} className="space-y-4">
            <FormField label="Description" name="description" value={modalPai.description} onChange={(v) => setModalPai(p => ({ ...p, description: v }))} required />
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Régis (€)" name="regis" type="number" value={modalPai.regis ?? ''} onChange={(v) => setModalPai(p => ({ ...p, regis: v ? Number(v) : null }))} />
              <FormField label="Isa (€)" name="isa" type="number" value={modalPai.isa ?? ''} onChange={(v) => setModalPai(p => ({ ...p, isa: v ? Number(v) : null }))} />
              <FormField label="Agathe (€)" name="agathe" type="number" value={modalPai.agathe ?? ''} onChange={(v) => setModalPai(p => ({ ...p, agathe: v ? Number(v) : null }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Total (€)" name="total" type="number" value={modalPai.total ?? ''} onChange={(v) => setModalPai(p => ({ ...p, total: v ? Number(v) : null }))} />
              <FormField label="Reste à payer (€)" name="reste_a_payer" type="number" value={modalPai.reste_a_payer ?? ''} onChange={(v) => setModalPai(p => ({ ...p, reste_a_payer: v ? Number(v) : null }))} />
            </div>
            <FormField label="Date échéance" name="date_echeance" value={modalPai.date_echeance ?? ''} onChange={(v) => setModalPai(p => ({ ...p, date_echeance: v || null }))} placeholder="ex: 31/8/2026" />
            <FormField label="Lien réservation" name="lien_reservation" type="url" value={modalPai.lien_reservation ?? ''} onChange={(v) => setModalPai(p => ({ ...p, lien_reservation: v || null }))} />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModalPai(null)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
              <button type="submit" disabled={sauvegarde} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">{sauvegarde ? 'Sauvegarde...' : 'Sauvegarder'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
