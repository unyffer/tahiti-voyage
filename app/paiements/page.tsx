'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import Modal from '@/components/Modal'
import FormField from '@/components/FormField'

interface PaiementLog {
  id: number; description: string; regis: number | null; isa: number | null
  agathe: number | null; total: number | null; date_echeance: string | null
  reste_a_payer: number | null; lien_reservation: string | null
}
interface PaiementAutre {
  id: number; description: string; total: number | null; par_personne: number | null
  reste_par_personne: number | null; situation: string | null
}

function euros(n: number | null | undefined) {
  if (n == null) return '–'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

const LOG_VIDE: Omit<PaiementLog, 'id'> = {
  description: '', regis: null, isa: null, agathe: null, total: null,
  date_echeance: null, reste_a_payer: null, lien_reservation: null
}
const AUTRE_VIDE: Omit<PaiementAutre, 'id'> = {
  description: '', total: null, par_personne: null, reste_par_personne: null, situation: null
}

export default function PaiementsPage() {
  const [logements, setLogements] = useState<PaiementLog[]>([])
  const [autres, setAutres] = useState<PaiementAutre[]>([])
  const [chargement, setChargement] = useState(true)
  const [modalLog, setModalLog] = useState<Partial<PaiementLog> | null>(null)
  const [modalAutre, setModalAutre] = useState<Partial<PaiementAutre> | null>(null)
  const [sauvegarde, setSauvegarde] = useState(false)

  const charger = useCallback(async () => {
    const [r1, r2] = await Promise.all([
      fetch('/api/paiements-logements').then(r => r.json()),
      fetch('/api/paiements-autres').then(r => r.json()),
    ])
    setLogements(r1 ?? [])
    setAutres(r2 ?? [])
    setChargement(false)
  }, [])

  useEffect(() => { charger() }, [charger])

  async function sauvegarderLog(e: React.FormEvent) {
    e.preventDefault()
    setSauvegarde(true)
    const method = modalLog?.id ? 'PATCH' : 'POST'
    await fetch('/api/paiements-logements', {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modalLog)
    })
    setModalLog(null)
    await charger()
    setSauvegarde(false)
  }

  async function sauvegarderAutre(e: React.FormEvent) {
    e.preventDefault()
    setSauvegarde(true)
    const method = modalAutre?.id ? 'PATCH' : 'POST'
    await fetch('/api/paiements-autres', {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modalAutre)
    })
    setModalAutre(null)
    await charger()
    setSauvegarde(false)
  }

  async function supprimerLog(id: number) {
    if (!confirm('Supprimer ce paiement ?')) return
    await fetch(`/api/paiements-logements?id=${id}`, { method: 'DELETE' })
    await charger()
  }

  async function supprimerAutre(id: number) {
    if (!confirm('Supprimer ce paiement ?')) return
    await fetch(`/api/paiements-autres?id=${id}`, { method: 'DELETE' })
    await charger()
  }

  if (chargement) return <div className="flex items-center justify-center h-48 text-gray-400">Chargement...</div>

  const totalLog = logements.reduce((s, r) => s + (r.total ?? 0), 0)
  const resteLog = logements.reduce((s, r) => s + (r.reste_a_payer ?? 0), 0)
  const totalAutres = autres.reduce((s, r) => s + (r.total ?? 0), 0)
  const resteAutres = autres.reduce((s, r) => s + (r.reste_par_personne ?? 0) * 3, 0)
  const resteTotal = resteLog + resteAutres

  const parPersonne = {
    Régis: logements.reduce((s, r) => s + (r.regis ?? 0), 0),
    Isa: logements.reduce((s, r) => s + (r.isa ?? 0), 0),
    Agathe: logements.reduce((s, r) => s + (r.agathe ?? 0), 0),
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
          <p className="text-2xl font-bold text-gray-800">{euros(totalLog + totalAutres)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Reste à payer</p>
          <p className="text-2xl font-bold text-orange-500">{euros(resteTotal)}</p>
          <p className="text-sm text-gray-400">{euros(Math.round(resteTotal / 3))} / pers</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Déjà payé</p>
          <p className="text-2xl font-bold text-emerald-600">{euros(totalLog + totalAutres - resteTotal)}</p>
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
        <div className="bg-teal-700 text-white px-5 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-lg">🏠 Logements</h2>
          <button
            onClick={() => setModalLog({ ...LOG_VIDE })}
            className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1 rounded-lg transition-colors"
          >
            + Ajouter
          </button>
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
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Reste</th>
                <th className="text-left px-4 py-3 text-gray-600 font-semibold">Échéance</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logements.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.description}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{p.regis ? euros(p.regis) : '–'}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{p.isa ? euros(p.isa) : '–'}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{p.agathe ? euros(p.agathe) : '–'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{euros(p.total)}</td>
                  <td className="px-4 py-3">
                    {!p.reste_a_payer || p.reste_a_payer <= 0
                      ? <span className="text-emerald-600 font-semibold">✅ Soldé</span>
                      : <span className="text-orange-600 font-semibold">{euros(p.reste_a_payer)}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.date_echeance ?? '–'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModalLog(p)} className="text-teal-600 hover:text-teal-700 p-1 rounded" title="Modifier">✏️</button>
                      <button onClick={() => supprimerLog(p.id)} className="text-red-400 hover:text-red-600 p-1 rounded" title="Supprimer">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right">{euros(parPersonne.Régis)}</td>
                <td className="px-4 py-3 text-right">{euros(parPersonne.Isa)}</td>
                <td className="px-4 py-3 text-right">{euros(parPersonne.Agathe)}</td>
                <td className="px-4 py-3 text-right">{euros(totalLog)}</td>
                <td className="px-4 py-3 text-orange-600">{euros(resteLog)} restant</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Autres paiements */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-purple-700 text-white px-5 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-lg">🎯 Activités & transports</h2>
          <button
            onClick={() => setModalAutre({ ...AUTRE_VIDE })}
            className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1 rounded-lg transition-colors"
          >
            + Ajouter
          </button>
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
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {autres.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.description}</td>
                  <td className="px-4 py-3 text-right font-semibold">{euros(p.total)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{euros(p.par_personne)}</td>
                  <td className="px-4 py-3 text-right">
                    {!p.reste_par_personne || p.reste_par_personne <= 0
                      ? <span className="text-emerald-600 font-semibold">✅</span>
                      : <span className="text-orange-600 font-semibold">{euros(p.reste_par_personne)}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.situation ?? '–'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setModalAutre(p)} className="text-teal-600 hover:text-teal-700 p-1 rounded" title="Modifier">✏️</button>
                      <button onClick={() => supprimerAutre(p.id)} className="text-red-400 hover:text-red-600 p-1 rounded" title="Supprimer">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal logement */}
      {modalLog && (
        <Modal titre={modalLog.id ? 'Modifier le paiement' : 'Ajouter un paiement logement'} onClose={() => setModalLog(null)}>
          <form onSubmit={sauvegarderLog} className="space-y-4">
            <FormField label="Description" name="description" value={modalLog.description} onChange={(v) => setModalLog(p => ({ ...p, description: v }))} required />
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Régis (€)" name="regis" type="number" value={modalLog.regis ?? ''} onChange={(v) => setModalLog(p => ({ ...p, regis: v ? Number(v) : null }))} />
              <FormField label="Isa (€)" name="isa" type="number" value={modalLog.isa ?? ''} onChange={(v) => setModalLog(p => ({ ...p, isa: v ? Number(v) : null }))} />
              <FormField label="Agathe (€)" name="agathe" type="number" value={modalLog.agathe ?? ''} onChange={(v) => setModalLog(p => ({ ...p, agathe: v ? Number(v) : null }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Total (€)" name="total" type="number" value={modalLog.total ?? ''} onChange={(v) => setModalLog(p => ({ ...p, total: v ? Number(v) : null }))} />
              <FormField label="Reste à payer (€)" name="reste_a_payer" type="number" value={modalLog.reste_a_payer ?? ''} onChange={(v) => setModalLog(p => ({ ...p, reste_a_payer: v ? Number(v) : null }))} />
            </div>
            <FormField label="Date échéance" name="date_echeance" value={modalLog.date_echeance ?? ''} onChange={(v) => setModalLog(p => ({ ...p, date_echeance: v || null }))} placeholder="ex: 31/8/2026" />
            <FormField label="Lien réservation" name="lien_reservation" type="url" value={modalLog.lien_reservation ?? ''} onChange={(v) => setModalLog(p => ({ ...p, lien_reservation: v || null }))} />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModalLog(null)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
              <button type="submit" disabled={sauvegarde} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                {sauvegarde ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal autre paiement */}
      {modalAutre && (
        <Modal titre={modalAutre.id ? 'Modifier' : 'Ajouter un paiement'} onClose={() => setModalAutre(null)}>
          <form onSubmit={sauvegarderAutre} className="space-y-4">
            <FormField label="Description" name="description" value={modalAutre.description} onChange={(v) => setModalAutre(p => ({ ...p, description: v }))} required />
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Total (€)" name="total" type="number" value={modalAutre.total ?? ''} onChange={(v) => setModalAutre(p => ({ ...p, total: v ? Number(v) : null }))} />
              <FormField label="/ pers (€)" name="par_personne" type="number" value={modalAutre.par_personne ?? ''} onChange={(v) => setModalAutre(p => ({ ...p, par_personne: v ? Number(v) : null }))} />
              <FormField label="Reste / pers (€)" name="reste_par_personne" type="number" value={modalAutre.reste_par_personne ?? ''} onChange={(v) => setModalAutre(p => ({ ...p, reste_par_personne: v ? Number(v) : null }))} />
            </div>
            <FormField label="Situation" name="situation" type="textarea" value={modalAutre.situation ?? ''} onChange={(v) => setModalAutre(p => ({ ...p, situation: v || null }))} placeholder="ex: Payé par Régis, Isa doit rembourser..." />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModalAutre(null)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
              <button type="submit" disabled={sauvegarde} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                {sauvegarde ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
