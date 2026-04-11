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
interface Virement {
  id: number; de: string; vers: string; montant: number
  date_virement: string | null; note: string | null
}

type Onglet = 'global' | 'regis' | 'isa' | 'agathe' | 'balance'
const ONGLETS: { id: Onglet; label: string; emoji: string }[] = [
  { id: 'global',  label: 'Vue globale', emoji: '📊' },
  { id: 'regis',   label: 'Régis',       emoji: '👤' },
  { id: 'isa',     label: 'Isa',         emoji: '👤' },
  { id: 'agathe',  label: 'Agathe',      emoji: '👤' },
  { id: 'balance', label: 'Balance 💰',  emoji: '⚖️' },
]

function euros(n: number | null | undefined, signed = false) {
  if (n == null) return '–'
  const formatted = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.abs(n))
  if (signed && n > 0) return `+${formatted}`
  if (signed && n < 0) return `-${formatted}`
  return formatted
}

// Auto-calcule le reste à payer depuis total et les montants payés
function calcReste(p: Partial<PaiementLog>): number | null {
  if (p.total == null) return null
  const paye = (p.regis ?? 0) + (p.isa ?? 0) + (p.agathe ?? 0)
  return Math.max(0, p.total - paye)
}

const LOG_VIDE: Omit<PaiementLog, 'id'> = {
  description: '', regis: null, isa: null, agathe: null, total: null,
  date_echeance: null, reste_a_payer: null, lien_reservation: null
}
const AUTRE_VIDE: Omit<PaiementAutre, 'id'> = {
  description: '', total: null, par_personne: null, reste_par_personne: null, situation: null
}

// Calcul des virements nécessaires pour équilibrer les 3 personnes
function calculerVirements(positions: Record<string, number>) {
  const soldes = Object.entries(positions).map(([nom, solde]) => ({ nom, solde }))
  const virements: { de: string; vers: string; montant: number }[] = []

  const debiteurs = soldes.filter(s => s.solde < -1).sort((a, b) => a.solde - b.solde)
  const crediteurs = soldes.filter(s => s.solde > 1).sort((a, b) => b.solde - a.solde)

  let i = 0, j = 0
  const d = debiteurs.map(x => ({ ...x }))
  const c = crediteurs.map(x => ({ ...x }))

  while (i < d.length && j < c.length) {
    const montant = Math.min(-d[i].solde, c[j].solde)
    if (montant > 0.5) {
      virements.push({ de: d[i].nom, vers: c[j].nom, montant: Math.round(montant) })
    }
    d[i].solde += montant
    c[j].solde -= montant
    if (Math.abs(d[i].solde) < 1) i++
    if (Math.abs(c[j].solde) < 1) j++
  }
  return virements
}

export default function PaiementsPage() {
  const [logements, setLogements] = useState<PaiementLog[]>([])
  const [autres, setAutres] = useState<PaiementAutre[]>([])
  const [virements, setVirements] = useState<Virement[]>([])
  const [chargement, setChargement] = useState(true)
  const [onglet, setOnglet] = useState<Onglet>('global')
  const [modalLog, setModalLog] = useState<Partial<PaiementLog> | null>(null)
  const [modalAutre, setModalAutre] = useState<Partial<PaiementAutre> | null>(null)
  const [modalVirement, setModalVirement] = useState(false)
  const [nvDe, setNvDe] = useState('Isa')
  const [nvVers, setNvVers] = useState('Régis')
  const [nvMontant, setNvMontant] = useState('')
  const [nvNote, setNvNote] = useState('')
  const [sauvegarde, setSauvegarde] = useState(false)

  const charger = useCallback(async () => {
    const [r1, r2, r3] = await Promise.all([
      fetch('/api/paiements-logements').then(r => r.json()),
      fetch('/api/paiements-autres').then(r => r.json()),
      fetch('/api/virements').then(r => r.json()),
    ])
    setLogements(r1 ?? [])
    setAutres(r2 ?? [])
    setVirements(r3 ?? [])
    setChargement(false)
  }, [])

  useEffect(() => { charger() }, [charger])

  // Met à jour auto le reste quand on modifie le modal
  function updateModal(updates: Partial<PaiementLog>) {
    setModalLog(prev => {
      const next = { ...prev, ...updates }
      return { ...next, reste_a_payer: calcReste(next) }
    })
  }

  async function sauvegarderLog(e: React.FormEvent) {
    e.preventDefault(); setSauvegarde(true)
    const payload = { ...modalLog, reste_a_payer: calcReste(modalLog ?? {}) }
    const method = modalLog?.id ? 'PATCH' : 'POST'
    await fetch('/api/paiements-logements', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    setModalLog(null); await charger(); setSauvegarde(false)
  }

  async function sauvegarderAutre(e: React.FormEvent) {
    e.preventDefault(); setSauvegarde(true)
    const method = modalAutre?.id ? 'PATCH' : 'POST'
    await fetch('/api/paiements-autres', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(modalAutre) })
    setModalAutre(null); await charger(); setSauvegarde(false)
  }

  async function supprimerLog(id: number) {
    if (!confirm('Supprimer ?')) return
    await fetch(`/api/paiements-logements?id=${id}`, { method: 'DELETE' }); await charger()
  }
  async function supprimerAutre(id: number) {
    if (!confirm('Supprimer ?')) return
    await fetch(`/api/paiements-autres?id=${id}`, { method: 'DELETE' }); await charger()
  }
  async function ajouterVirement(e: React.FormEvent) {
    e.preventDefault()
    if (!nvMontant || nvDe === nvVers) return
    setSauvegarde(true)
    await fetch('/api/virements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ de: nvDe, vers: nvVers, montant: Number(nvMontant), note: nvNote || null })
    })
    setModalVirement(false); setNvMontant(''); setNvNote(''); await charger(); setSauvegarde(false)
  }
  async function supprimerVirement(id: number) {
    await fetch(`/api/virements?id=${id}`, { method: 'DELETE' }); await charger()
  }

  if (chargement) return <div className="flex items-center justify-center h-48 text-gray-400">Chargement...</div>

  // Totaux logements
  const totalLog = logements.reduce((s, r) => s + (r.total ?? 0), 0)
  const resteLog = logements.reduce((s, r) => s + (r.reste_a_payer ?? 0), 0)
  // Totaux autres
  const totalAutres = autres.reduce((s, r) => s + (r.total ?? 0), 0)
  const resteAutres = autres.reduce((s, r) => s + (r.reste_par_personne ?? 0) * 3, 0)
  const resteTotal = resteLog + resteAutres

  // Ce que chaque personne a payé (logements uniquement pour l'instant)
  const payeLog = {
    Régis:  logements.reduce((s, r) => s + (r.regis ?? 0), 0),
    Isa:    logements.reduce((s, r) => s + (r.isa ?? 0), 0),
    Agathe: logements.reduce((s, r) => s + (r.agathe ?? 0), 0),
  }
  // Part équitable des logements
  const partEquitable = totalLog / 3

  // Positions nettes brutes (positif = on leur doit, négatif = ils doivent)
  const positionsBrutes = {
    Régis:  payeLog.Régis  - partEquitable,
    Isa:    payeLog.Isa    - partEquitable,
    Agathe: payeLog.Agathe - partEquitable,
  }
  // Appliquer les virements déjà effectués
  // Quand A vire X€ à B : A a remboursé X€ → sa position monte de +X, B a reçu X€ → sa position baisse de -X
  const positionsNettes = { ...positionsBrutes }
  for (const v of virements) {
    const de = v.de as keyof typeof positionsNettes
    const vers = v.vers as keyof typeof positionsNettes
    if (de in positionsNettes) positionsNettes[de] += v.montant
    if (vers in positionsNettes) positionsNettes[vers] -= v.montant
  }
  const positions = positionsNettes
  const virementsNeeded = calculerVirements(positions)

  // Données par personne
  const personneData = (nom: 'Régis' | 'Isa' | 'Agathe') => {
    const key = nom === 'Régis' ? 'regis' : nom === 'Isa' ? 'isa' : 'agathe'
    const rows = logements.filter(r => r[key] != null && (r[key] as number) > 0)
    const totalPaye = rows.reduce((s, r) => s + ((r[key] as number | null) ?? 0), 0)
    const resteLog = logements.filter(r => r.reste_a_payer && r.reste_a_payer > 0)
    return { rows, totalPaye, resteLog, partEquitable, net: positions[nom] }
  }

  // Table logements avec boutons édition
  const TableLogements = () => (
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
            <th className="px-3 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {logements.map((p) => (
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
              <td className="px-3 py-3">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { const r = { ...p }; setModalLog(r) }} className="text-teal-600 hover:text-teal-700 p-1" title="Modifier">✏️</button>
                  <button onClick={() => supprimerLog(p.id)} className="text-red-400 hover:text-red-600 p-1" title="Supprimer">🗑️</button>
                </div>
              </td>
            </tr>
          ))}
          <tr className="bg-gray-50 font-semibold text-sm">
            <td className="px-4 py-3 text-gray-700">Total</td>
            <td className="px-4 py-3 text-right">{euros(payeLog.Régis)}</td>
            <td className="px-4 py-3 text-right">{euros(payeLog.Isa)}</td>
            <td className="px-4 py-3 text-right">{euros(payeLog.Agathe)}</td>
            <td className="px-4 py-3 text-right">{euros(totalLog)}</td>
            <td className="px-4 py-3 text-orange-600">{euros(resteLog)} restant</td>
            <td colSpan={2}></td>
          </tr>
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">💸 Paiements</h1>
        <p className="text-gray-500 mt-1">Suivi complet — les totaux sont calculés automatiquement</p>
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

      {/* Onglets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {ONGLETS.map((o) => (
            <button key={o.id} onClick={() => setOnglet(o.id)}
              className={`flex-shrink-0 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                onglet === o.id
                  ? 'border-teal-600 text-teal-700 bg-teal-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* ONGLET : VUE GLOBALE */}
        {/* ═══════════════════════════════════════════════════ */}
        {onglet === 'global' && (
          <div className="space-y-0">
            <div className="px-5 py-3 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-teal-800">🏠 Logements</span>
              <button onClick={() => setModalLog({ ...LOG_VIDE })}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-3 py-1 rounded-lg">+ Ajouter</button>
            </div>
            <TableLogements />

            <div className="px-5 py-3 bg-purple-50 border-y border-purple-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-purple-800">🎯 Activités & transports</span>
              <button onClick={() => setModalAutre({ ...AUTRE_VIDE })}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1 rounded-lg">+ Ajouter</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Description</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Total</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">/ pers</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Reste / pers</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Situation</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {autres.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 group">
                      <td className="px-4 py-3 font-medium text-gray-800">{p.description}</td>
                      <td className="px-4 py-3 text-right font-semibold">{euros(p.total)}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{euros(p.par_personne)}</td>
                      <td className="px-4 py-3 text-right">
                        {!p.reste_par_personne || p.reste_par_personne <= 0
                          ? <span className="text-emerald-600 font-semibold">✅</span>
                          : <span className="text-orange-600 font-semibold">{euros(p.reste_par_personne)}</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px]">{p.situation ?? '–'}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setModalAutre(p)} className="text-teal-600 hover:text-teal-700 p-1">✏️</button>
                          <button onClick={() => supprimerAutre(p.id)} className="text-red-400 hover:text-red-600 p-1">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* ONGLETS PAR PERSONNE */}
        {/* ═══════════════════════════════════════════════════ */}
        {(['regis', 'isa', 'agathe'] as const).includes(onglet as 'regis' | 'isa' | 'agathe') && (() => {
          const nomMap: Record<string, 'Régis' | 'Isa' | 'Agathe'> = { regis: 'Régis', isa: 'Isa', agathe: 'Agathe' }
          const nom = nomMap[onglet]
          const key = onglet as 'regis' | 'isa' | 'agathe'
          const totalPaye = logements.reduce((s, r) => s + ((r[key] as number | null) ?? 0), 0)
          const net = positionsNettes[nom as keyof typeof positionsNettes]
          const aPayeDans = logements.filter(r => r[key] != null && (r[key] as number) > 0)

          // Paiements externes encore à faire (pas des remboursements entre nous)
          const logRestants = logements.filter(r => r.reste_a_payer && r.reste_a_payer > 0)
          const autresRestants = autres.filter(r => r.reste_par_personne && r.reste_par_personne > 0)
            + autresRestants.reduce((s, r) => s + (r.reste_par_personne ?? 0), 0)

          return (
            <div className="p-5 space-y-5">
              {/* Encadrés explication */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">💡 Deux choses bien distinctes :</p>
                <p>• <strong>Balance entre vous 3</strong> : qui a avancé plus que sa part → se règle par virement entre vous</p>
                <p>• <strong>Futurs paiements</strong> : ce que vous devez encore aux hébergements/prestataires → chacun paie sa part</p>
              </div>

              {/* Résumé */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-teal-600 font-medium uppercase tracking-wide">A avancé (logements)</p>
                  <p className="text-2xl font-bold text-teal-800 mt-1">{euros(totalPaye)}</p>
                  <p className="text-xs text-teal-600 mt-1">sur {euros(partEquitable)} de part équitable</p>
                </div>
                <div className={`border rounded-xl p-4 text-center ${Math.abs(net) < 2 ? 'bg-emerald-50 border-emerald-200' : net > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
                  <p className={`text-xs font-medium uppercase tracking-wide ${Math.abs(net) < 2 ? 'text-emerald-600' : net > 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                    Balance entre vous 3
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${Math.abs(net) < 2 ? 'text-emerald-700' : net > 0 ? 'text-emerald-700' : 'text-orange-600'}`}>
                    {Math.abs(net) < 2 ? '✅ Équilibré' : net > 0 ? `+${euros(net)}` : euros(net)}
                  </p>
                  <p className={`text-xs mt-1 ${Math.abs(net) < 2 ? 'text-emerald-600' : net > 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {Math.abs(net) < 2 ? 'Rien à régler entre vous' : net > 0 ? 'On lui doit' : 'Doit aux autres'}
                  </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                  <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">À payer aux prestataires</p>
                  <p className="text-2xl font-bold text-orange-700 mt-1">{euros(futursPaiements)}</p>
                  <p className="text-xs text-orange-600 mt-1">sa part des paiements restants</p>
                </div>
              </div>

              {/* Ce que cette personne a payé */}
              {aPayeDans.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">✅ A déjà contribué :</h3>
                  <div className="space-y-2">
                    {aPayeDans.map(r => (
                      <div key={r.id} className="flex items-center justify-between bg-teal-50 border border-teal-100 rounded-lg px-4 py-2">
                        <span className="text-sm text-gray-800">{r.description}</span>
                        <span className="font-semibold text-teal-700">{euros(r[key] as number)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Paiements futurs aux prestataires */}
              {(logRestants.length > 0 || autresRestants.length > 0) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">📅 Paiements futurs aux prestataires (part de {nom}) :</h3>
                  <div className="space-y-2">
                    {logRestants.map(r => (
                      <div key={r.id} className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-lg px-4 py-2">
                        <div>
                          <span className="text-sm text-gray-800">{r.description}</span>
                          {r.date_echeance && <span className="text-xs text-orange-500 ml-2">· avant {r.date_echeance}</span>}
                        </div>
                        <span className="font-semibold text-orange-600">{euros((r.reste_a_payer ?? 0) / 3)}</span>
                      </div>
                    ))}
                    {autresRestants.map(r => (
                      <div key={r.id} className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-lg px-4 py-2">
                        <div>
                          <span className="text-sm text-gray-800">{r.description}</span>
                          {r.situation && <p className="text-xs text-gray-500">{r.situation}</p>}
                        </div>
                        <span className="font-semibold text-orange-600">{euros(r.reste_par_personne)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* ═══════════════════════════════════════════════════ */}
        {/* ONGLET : BALANCE */}
        {/* ═══════════════════════════════════════════════════ */}
        {onglet === 'balance' && (
          <div className="p-5 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">💡 Comment lire cette page</p>
              <p>• <strong>Balance entre vous 3</strong> = qui a avancé plus que sa part pour les logements. Si tout le monde a remboursé, cette balance est à zéro.</p>
              <p className="mt-1">• <strong>Reste à payer aux hébergements</strong> = argent dû aux prestataires (hôtels, Airbnb…). Ce n&apos;est PAS un remboursement entre vous — c&apos;est chacun qui paiera sa part directement.</p>
            </div>

            {/* Positions nettes APRÈS virements effectués */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(Object.entries(positionsNettes) as [string, number][]).map(([nom, net]) => (
                <div key={nom} className={`border rounded-xl p-5 text-center ${
                  net > 1 ? 'bg-emerald-50 border-emerald-200'
                  : net < -1 ? 'bg-orange-50 border-orange-200'
                  : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className="font-bold text-gray-800 text-lg">{nom}</p>
                  <p className="text-2xl font-bold mt-2">
                    <span className={net > 1 ? 'text-emerald-600' : net < -1 ? 'text-orange-600' : 'text-gray-500'}>
                      {net > 1 ? `+${euros(net)}` : euros(net)}
                    </span>
                  </p>
                  <p className={`text-sm mt-1 font-medium ${net > 1 ? 'text-emerald-600' : net < -1 ? 'text-orange-600' : 'text-gray-400'}`}>
                    {net > 1 ? '← on lui doit' : net < -1 ? '→ doit encore' : '✅ équilibré'}
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500 space-y-0.5">
                    <p>Payé : {euros(payeLog[nom as keyof typeof payeLog])}</p>
                    <p>Part : {euros(partEquitable)}</p>
                    {positionsBrutes[nom as keyof typeof positionsBrutes] !== net && (
                      <p className="text-teal-600">Après virements : {euros(net)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Virements encore nécessaires */}
            {virementsNeeded.length > 0 ? (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-orange-800 mb-3">💸 Virements encore nécessaires :</h3>
                <div className="space-y-2">
                  {virementsNeeded.map((v, i) => (
                    <div key={i} className="flex items-center justify-between bg-white border border-orange-200 rounded-lg px-4 py-3">
                      <p className="font-semibold text-gray-800">
                        <span className="text-orange-600">{v.de}</span>
                        <span className="mx-2 text-gray-400">→</span>
                        <span className="text-emerald-600">{v.vers}</span>
                      </p>
                      <span className="text-xl font-bold text-gray-800">{euros(v.montant)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
                <p className="text-3xl mb-1">✅</p>
                <p className="font-semibold text-emerald-700 text-lg">Les comptes sont équilibrés !</p>
                <p className="text-sm text-emerald-600 mt-1">Personne ne doit rien à personne.</p>
              </div>
            )}

            {/* Virements déjà effectués */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-800">🏦 Virements déjà effectués</h3>
                <button onClick={() => setModalVirement(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium">
                  + Enregistrer un virement
                </button>
              </div>
              {virements.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-4">
                  Aucun virement enregistré. Si vous avez déjà fait des transferts entre vous, enregistre-les ici.
                </p>
              ) : (
                <div className="space-y-2">
                  {virements.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-lg px-4 py-3 group">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 text-sm">
                          <span className="text-orange-600">{v.de}</span>
                          <span className="mx-1.5 text-gray-400">→</span>
                          <span className="text-emerald-600">{v.vers}</span>
                          <span className="ml-2 font-bold">{euros(v.montant)}</span>
                        </p>
                        {v.note && <p className="text-xs text-gray-500 mt-0.5">{v.note}</p>}
                        {v.date_virement && <p className="text-xs text-gray-400">{v.date_virement}</p>}
                      </div>
                      <button onClick={() => supprimerVirement(v.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity"
                        title="Supprimer">🗑️</button>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 mt-1">
                    Total viré : {euros(virements.reduce((s, v) => s + v.montant, 0))}
                  </p>
                </div>
              )}
            </div>

            {/* Reste à payer aux prestataires — distinct de la balance entre vous */}
            {resteTotal > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-orange-800 mb-1">
                  📅 Paiements futurs aux prestataires — {euros(resteTotal)} au total ({euros(Math.round(resteTotal / 3))} / pers)
                </p>
                <p className="text-xs text-orange-600 mb-3">Ce n&apos;est PAS un remboursement entre vous — chacun paie sa part directement.</p>
                <ul className="space-y-1">
                  {logements.filter(r => r.reste_a_payer && r.reste_a_payer > 0).map(r => (
                    <li key={r.id} className="text-sm text-orange-700 flex justify-between gap-4">
                      <span>{r.description}{r.date_echeance && ` · avant ${r.date_echeance}`}</span>
                      <span className="font-semibold whitespace-nowrap">{euros(r.reste_a_payer)} ({euros(Math.round((r.reste_a_payer ?? 0) / 3))}/pers)</span>
                    </li>
                  ))}
                  {autres.filter(r => r.reste_par_personne && r.reste_par_personne > 0).map(r => (
                    <li key={r.id} className="text-sm text-orange-700 flex justify-between gap-4">
                      <span>{r.description}</span>
                      <span className="font-semibold whitespace-nowrap">{euros(r.reste_par_personne)}/pers</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* MODAL — Logement */}
      {/* ═══════════════════════════════════════════════════ */}
      {modalLog && (
        <Modal titre={modalLog.id ? 'Modifier le paiement logement' : 'Ajouter un logement'} onClose={() => setModalLog(null)}>
          <form onSubmit={sauvegarderLog} className="space-y-4">
            <FormField label="Description" name="description" value={modalLog.description}
              onChange={(v) => updateModal({ description: v })} required />

            <FormField label="Prix total du logement (€)" name="total" type="number" value={modalLog.total ?? ''}
              onChange={(v) => updateModal({ total: v ? Number(v) : null })}
              placeholder="Prix affiché sur l'annonce" />

            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
              Renseigne ce que chaque personne a déjà versé. Le reste est calculé automatiquement.
            </p>

            <div className="grid grid-cols-3 gap-3">
              <FormField label="Régis payé (€)" name="regis" type="number" value={modalLog.regis ?? ''}
                onChange={(v) => updateModal({ regis: v ? Number(v) : null })} />
              <FormField label="Isa payé (€)" name="isa" type="number" value={modalLog.isa ?? ''}
                onChange={(v) => updateModal({ isa: v ? Number(v) : null })} />
              <FormField label="Agathe payé (€)" name="agathe" type="number" value={modalLog.agathe ?? ''}
                onChange={(v) => updateModal({ agathe: v ? Number(v) : null })} />
            </div>

            {/* Reste calculé automatiquement */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-gray-600">Reste à payer (calculé)</span>
              <span className={`font-bold text-lg ${(calcReste(modalLog) ?? 0) > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                {calcReste(modalLog) === null ? '–' : `${euros(calcReste(modalLog))}`}
                {(calcReste(modalLog) ?? 0) <= 0 && calcReste(modalLog) !== null && ' ✅'}
              </span>
            </div>

            <FormField label="Date échéance" name="date_echeance" value={modalLog.date_echeance ?? ''}
              onChange={(v) => updateModal({ date_echeance: v || null })} placeholder="ex: 31/8/2026" />
            <FormField label="Lien réservation" name="lien_reservation" type="url" value={modalLog.lien_reservation ?? ''}
              onChange={(v) => updateModal({ lien_reservation: v || null })} />

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModalLog(null)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
              <button type="submit" disabled={sauvegarde} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                {sauvegarde ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* MODAL — Virement effectué */}
      {/* ═══════════════════════════════════════════════════ */}
      {modalVirement && (
        <Modal titre="Enregistrer un virement" onClose={() => setModalVirement(false)}>
          <form onSubmit={ajouterVirement} className="space-y-4">
            <p className="text-sm text-gray-500">
              Enregistre ici un virement déjà fait entre vous. Il sera déduit du calcul de balance.
            </p>
            <div className="grid grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">De</label>
                <select value={nvDe} onChange={e => setNvDe(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {['Régis', 'Isa', 'Agathe'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="text-center text-gray-400 text-xl pt-5">→</div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vers</label>
                <select value={nvVers} onChange={e => setNvVers(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {['Régis', 'Isa', 'Agathe'].filter(p => p !== nvDe).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <FormField label="Montant (€)" name="montant" type="number" value={nvMontant}
              onChange={setNvMontant} placeholder="ex: 543" required />
            <FormField label="Note (optionnel)" name="note" value={nvNote}
              onChange={setNvNote} placeholder="ex: remboursement baleines" />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModalVirement(false)} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
              <button type="submit" disabled={sauvegarde || nvDe === nvVers || !nvMontant}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                {sauvegarde ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* MODAL — Autre paiement */}
      {/* ═══════════════════════════════════════════════════ */}
      {modalAutre && (
        <Modal titre={modalAutre.id ? 'Modifier' : 'Ajouter un paiement'} onClose={() => setModalAutre(null)}>
          <form onSubmit={sauvegarderAutre} className="space-y-4">
            <FormField label="Description" name="description" value={modalAutre.description}
              onChange={(v) => setModalAutre(p => ({ ...p, description: v }))} required />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Total (€)" name="total" type="number" value={modalAutre.total ?? ''}
                onChange={(v) => setModalAutre(p => ({ ...p, total: v ? Number(v) : null, par_personne: v ? Math.round(Number(v) / 3) : null }))} />
              <FormField label="/ pers (€)" name="par_personne" type="number" value={modalAutre.par_personne ?? ''}
                onChange={(v) => setModalAutre(p => ({ ...p, par_personne: v ? Number(v) : null }))} />
            </div>
            <FormField label="Reste à payer / pers (€)" name="reste_par_personne" type="number" value={modalAutre.reste_par_personne ?? ''}
              onChange={(v) => setModalAutre(p => ({ ...p, reste_par_personne: v ? Number(v) : null }))}
              placeholder="0 si déjà réglé" />
            <FormField label="Situation / qui a payé" name="situation" type="textarea" value={modalAutre.situation ?? ''}
              onChange={(v) => setModalAutre(p => ({ ...p, situation: v || null }))}
              placeholder="ex: Payé par Régis, Isa doit lui rembourser..." />
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
