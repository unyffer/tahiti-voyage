'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import Modal from '@/components/Modal'
import FormField from '@/components/FormField'
import { useCanEdit } from '@/components/RoleContext'
import { apiFetch } from '@/lib/toast'

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

type Onglet = 'global' | 'echeances' | 'virements'
const ONGLETS: { id: Onglet; label: string }[] = [
  { id: 'global',    label: '📊 Vue globale' },
  { id: 'echeances', label: '📅 Prochaines échéances' },
  { id: 'virements', label: '💸 Virements entre nous' },
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
  const canEdit = useCanEdit()
  const PERSONNES = ['Régis', 'Isa', 'Agathe'] as const

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
    const { ok } = await apiFetch('/api/paiements-logements', {
      method: modalLog?.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...modalLog, reste_a_payer: calcReste(modalLog ?? {}) })
    })
    if (ok) { setModalLog(null); await charger() }
    setSauvegarde(false)
  }

  async function sauvegarderAutre(e: React.FormEvent) {
    e.preventDefault(); setSauvegarde(true)
    const { ok } = await apiFetch('/api/paiements-autres', {
      method: modalAutre?.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modalAutre)
    })
    if (ok) { setModalAutre(null); await charger() }
    setSauvegarde(false)
  }

  async function supprimerLog(id: number) {
    if (!confirm('Supprimer ?')) return
    const { ok } = await apiFetch(`/api/paiements-logements?id=${id}`, { method: 'DELETE' })
    if (ok) await charger()
  }
  async function supprimerAutre(id: number) {
    if (!confirm('Supprimer ?')) return
    const { ok } = await apiFetch(`/api/paiements-autres?id=${id}`, { method: 'DELETE' })
    if (ok) await charger()
  }
  async function ajouterVirement(e: React.FormEvent) {
    e.preventDefault()
    if (!nvMontant || nvDe === nvVers) return
    setSauvegarde(true)
    const { ok } = await apiFetch('/api/virements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ de: nvDe, vers: nvVers, montant: Number(nvMontant), note: nvNote || null })
    })
    if (ok) { setModalVirement(false); setNvMontant(''); setNvNote(''); await charger() }
    setSauvegarde(false)
  }
  async function supprimerVirement(id: number) {
    const { ok } = await apiFetch(`/api/virements?id=${id}`, { method: 'DELETE' })
    if (ok) await charger()
  }

  if (chargement) return <div className="flex items-center justify-center h-48 text-gray-400">Chargement...</div>

  // Totaux globaux (ce que vous devez aux prestataires)
  const totalLog = logements.reduce((s, r) => s + (r.total ?? 0), 0)
  const resteLog = logements.reduce((s, r) => s + (r.reste_a_payer ?? 0), 0)
  const totalAutres = autres.reduce((s, r) => s + (r.total ?? 0), 0)
  const resteAutres = autres.reduce((s, r) => s + (r.reste_par_personne ?? 0) * 3, 0)
  const totalGeneral = totalLog + totalAutres
  const resteTotal = resteLog + resteAutres
  const dejaPayeTotal = totalGeneral - resteTotal

  // Qui a payé quoi (informatif uniquement — aucune conclusion sur qui doit quoi)
  const payeParPersonne = {
    Régis:  logements.reduce((s, r) => s + (r.regis ?? 0), 0),
    Isa:    logements.reduce((s, r) => s + (r.isa ?? 0), 0),
    Agathe: logements.reduce((s, r) => s + (r.agathe ?? 0), 0),
  }

  // Échéances à venir triées par date
  const echeances = logements
    .filter(r => r.reste_a_payer && r.reste_a_payer > 0)
    .sort((a, b) => {
      if (!a.date_echeance) return 1
      if (!b.date_echeance) return -1
      return a.date_echeance > b.date_echeance ? 1 : -1
    })

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
                <td className="px-4 py-3 text-right">{euros(payeParPersonne.Régis)}</td>
                <td className="px-4 py-3 text-right">{euros(payeParPersonne.Isa)}</td>
                <td className="px-4 py-3 text-right">{euros(payeParPersonne.Agathe)}</td>
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
          <p className="text-sm text-gray-500">Budget total voyage</p>
          <p className="text-2xl font-bold text-gray-800">{euros(totalGeneral)}</p>
          <p className="text-sm text-gray-400">{euros(Math.round(totalGeneral / 3))} / pers</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Déjà réglé aux prestataires</p>
          <p className="text-2xl font-bold text-emerald-600">{euros(dejaPayeTotal)}</p>
          <p className="text-sm text-gray-400">{totalGeneral > 0 ? Math.round((dejaPayeTotal / totalGeneral) * 100) : 0}% du budget</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Reste à régler aux prestataires</p>
          <p className="text-2xl font-bold text-orange-500">{euros(resteTotal)}</p>
          <p className="text-sm text-gray-400">~{euros(Math.round(resteTotal / 3))} / pers (selon qui paiera)</p>
        </div>
      </div>

      {/* Info pédagogique */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold">💡 Comment ça marche</p>
        <p className="mt-1">Le "reste à régler" est ce qui est encore dû aux hôtels/prestataires. On ne sait pas encore qui paiera — peu importe qui le fait, les autres lui rembourseront. Ce n&apos;est pas une dette entre vous.</p>
        <p className="mt-1">Pour enregistrer un virement déjà fait entre vous → onglet <strong>Virements entre nous</strong>.</p>
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
        {/* ONGLET : PROCHAINES ÉCHÉANCES */}
        {/* ═══════════════════════════════════════════════════ */}
        {onglet === 'echeances' && (
          <div className="p-5 space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <p className="font-semibold">📅 Comment lire cette section</p>
              <p className="mt-1">Ce sont les paiements encore dus aux hébergements. <strong>On ne sait pas encore qui paiera</strong> — ça n&apos;a pas d&apos;importance. Celui qui paie se fera rembourser par les deux autres. Ces montants ne sont pas des dettes entre vous.</p>
            </div>

            {/* Total restant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                <p className="text-sm text-orange-600 font-medium">Total encore à régler</p>
                <p className="text-3xl font-bold text-orange-700 mt-1">{euros(resteTotal)}</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                <p className="text-sm text-orange-600 font-medium">Part estimée par personne</p>
                <p className="text-3xl font-bold text-orange-700 mt-1">~{euros(Math.round(resteTotal / 3))}</p>
                <p className="text-xs text-orange-500 mt-1">(selon qui paiera)</p>
              </div>
            </div>

            {/* Échéances logements */}
            {echeances.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">🏠 Soldes restants — hébergements</h3>
                <div className="space-y-3">
                  {echeances.map(r => (
                    <div key={r.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="font-semibold text-gray-800">{r.description}</p>
                          {r.date_echeance && (
                            <p className="text-sm text-orange-600 mt-0.5">⏰ Échéance : {r.date_echeance}</p>
                          )}
                          {r.lien_reservation && r.lien_reservation.startsWith('http') && (
                            <a href={r.lien_reservation} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-teal-600 hover:underline">🔗 Lien réservation</a>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-600">{euros(r.reste_a_payer)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">~{euros(Math.round((r.reste_a_payer ?? 0) / 3))} / pers</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Autres paiements restants */}
            {autres.filter(r => r.reste_par_personne && r.reste_par_personne > 0).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">🎯 Activités & transports restants</h3>
                <div className="space-y-2">
                  {autres.filter(r => r.reste_par_personne && r.reste_par_personne > 0).map(r => (
                    <div key={r.id} className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-800">{r.description}</p>
                        {r.situation && <p className="text-xs text-gray-500">{r.situation}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-600">{euros((r.reste_par_personne ?? 0) * 3)}</p>
                        <p className="text-xs text-gray-400">{euros(r.reste_par_personne)} / pers</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Qui a payé quoi — informatif */}
            <details className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
              <summary className="px-5 py-3 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
                📋 Historique — qui a payé quoi aux prestataires (informatif)
              </summary>
              <div className="px-5 pb-4 pt-2 space-y-2">
                {(['Régis', 'Isa', 'Agathe'] as const).map(nom => {
                  const key = nom === 'Régis' ? 'regis' : nom === 'Isa' ? 'isa' : 'agathe'
                  const montant = payeParPersonne[nom]
                  return montant > 0 ? (
                    <div key={nom} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{nom} a avancé (logements)</span>
                      <span className="font-semibold text-gray-800">{euros(montant)}</span>
                    </div>
                  ) : null
                })}
                <p className="text-xs text-gray-400 mt-2 italic">
                  Ces montants reflètent qui a payé le prestataire, pas les dettes entre vous (déjà réglées par virement).
                </p>
              </div>
            </details>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* ONGLET : VIREMENTS ENTRE NOUS */}
        {/* ═══════════════════════════════════════════════════ */}
        {onglet === 'virements' && (
          <div className="p-5 space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <p className="font-semibold">💸 À quoi sert cet onglet ?</p>
              <p className="mt-1">Utilisez cet onglet pour noter les virements que vous faites <strong>entre vous 3</strong> quand quelqu&apos;un a avancé de l&apos;argent pour les autres. Exemple : Régis paie l&apos;hôtel pour tout le monde → Isa et Agathe lui font un virement.</p>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setModalVirement(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
                + Enregistrer un virement
              </button>
            </div>

            {virements.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-3xl mb-2">🤝</p>
                <p className="font-medium text-gray-500">Aucun virement enregistré</p>
                <p className="text-sm mt-1">Enregistre ici les transferts d&apos;argent entre vous 3.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {virements.map((v) => (
                  <div key={v.id} className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm group">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        <span className="text-orange-600">{v.de}</span>
                        <span className="mx-2 text-gray-400">→</span>
                        <span className="text-emerald-600">{v.vers}</span>
                      </p>
                      {v.note && <p className="text-sm text-gray-500 mt-0.5">{v.note}</p>}
                      {v.date_virement && <p className="text-xs text-gray-400">{v.date_virement}</p>}
                    </div>
                    <span className="text-xl font-bold text-gray-800">{euros(v.montant)}</span>
                    <button onClick={() => supprimerVirement(v.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity" title="Supprimer">🗑️</button>
                  </div>
                ))}
                <div className="flex justify-between text-sm text-gray-500 px-2">
                  <span>Total des virements enregistrés</span>
                  <span className="font-semibold">{euros(virements.reduce((s, v) => s + v.montant, 0))}</span>
                </div>
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
