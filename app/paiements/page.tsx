'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import BottomSheet from '@/components/BottomSheet'
import FormField from '@/components/FormField'
import StatusBadge from '@/components/StatusBadge'
import { useCanEdit } from '@/components/RoleContext'
import { apiFetch } from '@/lib/toast'
import { Pencil, Trash2, Plus, ChevronDown } from 'lucide-react'

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

type Onglet = 'echeances' | 'logements' | 'activites' | 'virements'

function euros(n: number | null | undefined) {
  if (n == null) return '–'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.abs(n))
}

function calcReste(p: Partial<PaiementLog>): number | null {
  if (p.total == null) return null
  const paye = (p.regis ?? 0) + (p.isa ?? 0) + (p.agathe ?? 0)
  return Math.max(0, p.total - paye)
}

const CHAMPS_FINANCIERS: (keyof PaiementLog)[] = ['total', 'regis', 'isa', 'agathe']

const LOG_VIDE: Omit<PaiementLog, 'id'> = {
  description: '', regis: null, isa: null, agathe: null, total: null,
  date_echeance: null, reste_a_payer: null, lien_reservation: null,
}
const AUTRE_VIDE: Omit<PaiementAutre, 'id'> = {
  description: '', total: null, par_personne: null, reste_par_personne: null, situation: null,
}

export default function PaiementsPage() {
  const [logements, setLogements] = useState<PaiementLog[]>([])
  const [autres, setAutres] = useState<PaiementAutre[]>([])
  const [virements, setVirements] = useState<Virement[]>([])
  const [chargement, setChargement] = useState(true)
  const [onglet, setOnglet] = useState<Onglet>('echeances')
  const [modalLog, setModalLog] = useState<Partial<PaiementLog> | null>(null)
  const [modalAutre, setModalAutre] = useState<Partial<PaiementAutre> | null>(null)
  const [modalVirement, setModalVirement] = useState(false)
  const [nvDe, setNvDe] = useState('Isa')
  const [nvVers, setNvVers] = useState('Régis')
  const [nvMontant, setNvMontant] = useState('')
  const [nvNote, setNvNote] = useState('')
  const [sauvegarde, setSauvegarde] = useState(false)
  const canEdit = useCanEdit()

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

  function updateModal(updates: Partial<PaiementLog>) {
    setModalLog(prev => {
      const next = { ...prev, ...updates }
      const toucheFinancier = Object.keys(updates).some(k => CHAMPS_FINANCIERS.includes(k as keyof PaiementLog))
      return toucheFinancier ? { ...next, reste_a_payer: calcReste(next) } : next
    })
  }

  async function sauvegarderLog(e: React.FormEvent) {
    e.preventDefault(); setSauvegarde(true)
    const { ok } = await apiFetch('/api/paiements-logements', {
      method: modalLog?.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...modalLog, reste_a_payer: calcReste(modalLog ?? {}) }),
    })
    if (ok) { setModalLog(null); await charger() }
    setSauvegarde(false)
  }

  async function sauvegarderAutre(e: React.FormEvent) {
    e.preventDefault(); setSauvegarde(true)
    const { ok } = await apiFetch('/api/paiements-autres', {
      method: modalAutre?.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modalAutre),
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
      body: JSON.stringify({ de: nvDe, vers: nvVers, montant: Number(nvMontant), note: nvNote || null }),
    })
    if (ok) { setModalVirement(false); setNvMontant(''); setNvNote(''); await charger() }
    setSauvegarde(false)
  }
  async function supprimerVirement(id: number) {
    const { ok } = await apiFetch(`/api/virements?id=${id}`, { method: 'DELETE' })
    if (ok) await charger()
  }

  if (chargement) return <div className="flex items-center justify-center h-48 text-slate-400">Chargement...</div>

  const totalLog = logements.reduce((s, r) => s + (r.total ?? 0), 0)
  const resteLog = logements.reduce((s, r) => s + (r.reste_a_payer ?? 0), 0)
  const totalAutres = autres.reduce((s, r) => s + (r.total ?? 0), 0)
  const resteAutres = autres.reduce((s, r) => s + ((r.reste_par_personne ?? 0) * 3), 0)
  const totalGeneral = totalLog + totalAutres
  const resteTotal = resteLog + resteAutres
  const dejaPayeTotal = totalGeneral - resteTotal
  const pct = totalGeneral > 0 ? Math.round((dejaPayeTotal / totalGeneral) * 100) : 0

  const echeances = logements
    .filter(r => r.reste_a_payer && r.reste_a_payer > 0)
    .sort((a, b) => {
      if (!a.date_echeance) return 1
      if (!b.date_echeance) return -1
      return a.date_echeance > b.date_echeance ? 1 : -1
    })

  const ONGLETS: { id: Onglet; label: string }[] = [
    { id: 'echeances', label: '📅 Échéances' },
    { id: 'logements', label: '🏠 Logements' },
    { id: 'activites', label: '🎯 Activités' },
    { id: 'virements', label: '💸 Virements' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Finances</h1>
        <p className="text-slate-400 text-sm mt-0.5">Suivi des paiements du voyage</p>
      </div>

      {/* Bilan */}
      <div className="px-5 mb-5">
        <div className="bg-gradient-to-br from-sky-600 to-sky-800 rounded-2xl p-5 text-white shadow-md shadow-sky-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sky-200 text-xs font-semibold uppercase tracking-wider">Réglé</p>
              <p className="text-3xl font-black mt-0.5">{euros(dejaPayeTotal)}</p>
            </div>
            <div className="text-right">
              <p className="text-sky-200 text-xs font-semibold uppercase tracking-wider">Restant</p>
              <p className="text-2xl font-black mt-0.5 text-amber-300">{euros(resteTotal)}</p>
            </div>
          </div>
          {/* Progress */}
          <div className="h-2 bg-sky-900/40 rounded-full overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-white/80 to-white transition-all"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-sky-200">
            <span>{pct}% du budget réglé</span>
            <span>Total : {euros(totalGeneral)}</span>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-0 border-b border-slate-100 px-5 overflow-x-auto no-scrollbar">
        {ONGLETS.map(o => (
          <button
            key={o.id}
            onClick={() => setOnglet(o.id)}
            className={`flex-shrink-0 py-2.5 px-3 text-sm font-semibold border-b-2 transition-colors ${
              onglet === o.id
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* ── ONGLET ÉCHÉANCES ── */}
      {onglet === 'echeances' && (
        <div className="px-5 pt-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center">
              <p className="text-xs text-orange-500 font-semibold">À régler</p>
              <p className="text-2xl font-black text-orange-600 mt-1">{euros(resteTotal)}</p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center">
              <p className="text-xs text-orange-500 font-semibold">Par personne</p>
              <p className="text-2xl font-black text-orange-600 mt-1">~{euros(Math.round(resteTotal / 3))}</p>
            </div>
          </div>

          {echeances.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className="text-3xl mb-2">✅</p>
              <p className="font-semibold text-slate-500">Tout est réglé !</p>
            </div>
          ) : (
            echeances.map(r => (
              <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">{r.description}</p>
                    {r.date_echeance && (
                      <p className="text-sm text-orange-500 mt-0.5">⏰ {r.date_echeance}</p>
                    )}
                    {r.lien_reservation && r.lien_reservation.startsWith('http') && (
                      <a href={r.lien_reservation} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-sky-600 hover:underline mt-0.5 inline-block">🔗 Réservation</a>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-black text-orange-600">{euros(r.reste_a_payer)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">~{euros(Math.round((r.reste_a_payer ?? 0) / 3))}/pers</p>
                    {canEdit && (
                      <button onClick={() => setModalLog({ ...r })}
                        className="mt-2 text-xs text-sky-600 hover:text-sky-700 font-semibold">
                        Modifier →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Activités restantes */}
          {autres.filter(r => r.reste_par_personne && r.reste_par_personne > 0).map(r => (
            <div key={r.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{r.description}</p>
                {r.situation && <p className="text-xs text-slate-500 mt-0.5">{r.situation}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-black text-orange-600">{euros((r.reste_par_personne ?? 0) * 3)}</p>
                <p className="text-xs text-slate-400">{euros(r.reste_par_personne)}/pers</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ONGLET LOGEMENTS ── */}
      {onglet === 'logements' && (
        <div className="px-5 pt-5">
          <div className="space-y-2 mb-4">
            {logements.map(p => (
              <div key={p.id} className="bg-white border border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{p.description}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {!p.reste_a_payer || p.reste_a_payer <= 0
                      ? <StatusBadge statut="solde" />
                      : <span className="text-sm font-bold text-orange-600">{euros(p.reste_a_payer)} restant</span>}
                    {p.date_echeance && <span className="text-xs text-slate-400">{p.date_echeance}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-slate-800">{euros(p.total)}</p>
                  {canEdit && (
                    <div className="flex gap-1 mt-1 justify-end">
                      <button onClick={() => setModalLog({ ...p })}
                        className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => supprimerLog(p.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Total */}
          <div className="bg-slate-50 rounded-2xl px-4 py-3 flex justify-between items-center">
            <span className="font-semibold text-slate-600">Total logements</span>
            <span className="font-black text-slate-900">{euros(totalLog)}</span>
          </div>
          {canEdit && (
            <button onClick={() => setModalLog({ ...LOG_VIDE })}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-sky-300 hover:text-sky-500 transition-colors">
              <Plus size={16} /><span className="text-sm font-semibold">Ajouter un logement</span>
            </button>
          )}
        </div>
      )}

      {/* ── ONGLET ACTIVITÉS ── */}
      {onglet === 'activites' && (
        <div className="px-5 pt-5">
          <div className="space-y-2 mb-4">
            {autres.map(p => (
              <div key={p.id} className="bg-white border border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{p.description}</p>
                  {p.situation && <p className="text-xs text-slate-500 mt-0.5 truncate">{p.situation}</p>}
                  {(!p.reste_par_personne || p.reste_par_personne <= 0) && (
                    <StatusBadge statut="solde" className="mt-1" />
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-slate-800">{euros(p.total)}</p>
                  {p.reste_par_personne && p.reste_par_personne > 0 && (
                    <p className="text-xs text-orange-500">{euros(p.reste_par_personne)}/pers</p>
                  )}
                  {canEdit && (
                    <div className="flex gap-1 mt-1 justify-end">
                      <button onClick={() => setModalAutre({ ...p })}
                        className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => supprimerAutre(p.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-2xl px-4 py-3 flex justify-between items-center">
            <span className="font-semibold text-slate-600">Total activités</span>
            <span className="font-black text-slate-900">{euros(totalAutres)}</span>
          </div>
          {canEdit && (
            <button onClick={() => setModalAutre({ ...AUTRE_VIDE })}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-sky-300 hover:text-sky-500 transition-colors">
              <Plus size={16} /><span className="text-sm font-semibold">Ajouter un paiement</span>
            </button>
          )}
        </div>
      )}

      {/* ── ONGLET VIREMENTS ── */}
      {onglet === 'virements' && (
        <div className="px-5 pt-5">
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 text-sm text-sky-800 mb-4">
            <p className="font-semibold mb-1">💸 Virements entre vous</p>
            <p className="text-xs text-sky-600">Enregistrez ici les transferts déjà effectués entre Régis, Isa et Agathe.</p>
          </div>
          {virements.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className="text-3xl mb-2">🤝</p>
              <p className="font-medium text-slate-500">Aucun virement enregistré</p>
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {virements.map(v => (
                <div key={v.id} className="bg-white border border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      <span className="text-orange-600">{v.de}</span>
                      <span className="text-slate-300 mx-1.5">→</span>
                      <span className="text-emerald-600">{v.vers}</span>
                    </p>
                    {v.note && <p className="text-xs text-slate-500 mt-0.5">{v.note}</p>}
                    {v.date_virement && <p className="text-xs text-slate-400">{v.date_virement}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-black text-slate-800">{euros(v.montant)}</span>
                    {canEdit && (
                      <button onClick={() => supprimerVirement(v.id)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex justify-between text-sm text-slate-500 px-2">
                <span>Total virements</span>
                <span className="font-semibold">{euros(virements.reduce((s, v) => s + v.montant, 0))}</span>
              </div>
            </div>
          )}
          {canEdit && (
            <button onClick={() => setModalVirement(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-sky-300 hover:text-sky-500 transition-colors">
              <Plus size={16} /><span className="text-sm font-semibold">Enregistrer un virement</span>
            </button>
          )}
        </div>
      )}

      {/* ── MODALS ── */}
      {modalLog && (
        <BottomSheet titre={modalLog.id ? 'Modifier le paiement' : 'Ajouter un logement'} onClose={() => setModalLog(null)}>
          <form onSubmit={sauvegarderLog} className="space-y-4 pt-2">
            <FormField label="Description" name="description" value={modalLog.description}
              onChange={v => updateModal({ description: v })} required />
            <FormField label="Prix total (€)" name="total" type="number" value={modalLog.total ?? ''}
              onChange={v => updateModal({ total: v ? Number(v) : null })}
              placeholder="Prix affiché sur l'annonce" />
            <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3">
              Renseigne ce que chaque personne a déjà versé. Le reste est calculé automatiquement.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <FormField label="Régis payé" name="regis" type="number" value={modalLog.regis ?? ''}
                onChange={v => updateModal({ regis: v ? Number(v) : null })} />
              <FormField label="Isa payé" name="isa" type="number" value={modalLog.isa ?? ''}
                onChange={v => updateModal({ isa: v ? Number(v) : null })} />
              <FormField label="Agathe payé" name="agathe" type="number" value={modalLog.agathe ?? ''}
                onChange={v => updateModal({ agathe: v ? Number(v) : null })} />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center">
              <span className="text-sm text-slate-600">Reste calculé</span>
              <span className={`font-black text-lg ${(calcReste(modalLog) ?? 0) > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                {calcReste(modalLog) === null ? '–' : `${euros(calcReste(modalLog))}${(calcReste(modalLog) ?? 0) <= 0 ? ' ✅' : ''}`}
              </span>
            </div>
            <FormField label="Date échéance" name="date_echeance" value={modalLog.date_echeance ?? ''}
              onChange={v => updateModal({ date_echeance: v || null })} placeholder="ex: 31/8/2026" />
            <FormField label="Lien réservation" name="lien_reservation" type="url" value={modalLog.lien_reservation ?? ''}
              onChange={v => updateModal({ lien_reservation: v || null })} />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalLog(null)}
                className="flex-1 py-3 text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold">
                Annuler
              </button>
              <button type="submit" disabled={sauvegarde}
                className="flex-1 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 disabled:opacity-50 font-semibold">
                {sauvegarde ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        </BottomSheet>
      )}

      {modalAutre && (
        <BottomSheet titre={modalAutre.id ? 'Modifier' : 'Ajouter un paiement'} onClose={() => setModalAutre(null)}>
          <form onSubmit={sauvegarderAutre} className="space-y-4 pt-2">
            <FormField label="Description" name="description" value={modalAutre.description}
              onChange={v => setModalAutre(p => ({ ...p, description: v }))} required />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Total (€)" name="total" type="number" value={modalAutre.total ?? ''}
                onChange={v => setModalAutre(p => ({ ...p, total: v ? Number(v) : null, par_personne: v ? Math.round(Number(v) / 3) : null }))} />
              <FormField label="/ pers (€)" name="par_personne" type="number" value={modalAutre.par_personne ?? ''}
                onChange={v => setModalAutre(p => ({ ...p, par_personne: v ? Number(v) : null }))} />
            </div>
            <FormField label="Reste / pers (€)" name="reste_par_personne" type="number" value={modalAutre.reste_par_personne ?? ''}
              onChange={v => setModalAutre(p => ({ ...p, reste_par_personne: v ? Number(v) : null }))}
              placeholder="0 si déjà réglé" />
            <FormField label="Situation / qui a payé" name="situation" type="textarea" value={modalAutre.situation ?? ''}
              onChange={v => setModalAutre(p => ({ ...p, situation: v || null }))} />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalAutre(null)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold">Annuler</button>
              <button type="submit" disabled={sauvegarde}
                className="flex-1 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 disabled:opacity-50 font-semibold">
                {sauvegarde ? '...' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        </BottomSheet>
      )}

      {modalVirement && (
        <BottomSheet titre="Enregistrer un virement" onClose={() => setModalVirement(false)}>
          <form onSubmit={ajouterVirement} className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-2 items-center">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">De</label>
                <select value={nvDe} onChange={e => setNvDe(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
                  {['Régis', 'Isa', 'Agathe'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="text-center text-slate-300 text-xl pt-5">→</div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vers</label>
                <select value={nvVers} onChange={e => setNvVers(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
                  {['Régis', 'Isa', 'Agathe'].filter(p => p !== nvDe).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <FormField label="Montant (€)" name="montant" type="number" value={nvMontant}
              onChange={setNvMontant} placeholder="ex: 543" required />
            <FormField label="Note (optionnel)" name="note" value={nvNote}
              onChange={setNvNote} placeholder="ex: remboursement baleines" />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalVirement(false)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold">Annuler</button>
              <button type="submit" disabled={sauvegarde || nvDe === nvVers || !nvMontant}
                className="flex-1 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 disabled:opacity-50 font-semibold">
                {sauvegarde ? '...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </BottomSheet>
      )}
    </div>
  )
}
