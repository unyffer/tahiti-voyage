'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import BottomSheet from '@/components/BottomSheet'
import FormField from '@/components/FormField'
import StatusBadge from '@/components/StatusBadge'
import { ILES } from '@/lib/constants'
import { isUrl } from '@/lib/utils'
import { apiFetch } from '@/lib/toast'
import { useCanEdit } from '@/components/RoleContext'
import { Pencil, Trash2, Plus, ExternalLink } from 'lucide-react'

interface Logement { id: number; ile: string; periode: string; lien_annonce: string | null; commentaires: string | null; questions: string | null }
interface PaiementLog { id: number; description: string; regis: number | null; isa: number | null; agathe: number | null; total: number | null; date_echeance: string | null; reste_a_payer: number | null; lien_reservation: string | null }

function euros(n: number | null | undefined) {
  if (n == null) return '–'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function calcReste(p: Partial<PaiementLog>): number | null {
  if (p.total == null) return null
  const paye = (p.regis ?? 0) + (p.isa ?? 0) + (p.agathe ?? 0)
  return Math.max(0, p.total - paye)
}

const CHAMPS_FINANCIERS: (keyof PaiementLog)[] = ['total', 'regis', 'isa', 'agathe']
const LOG_VIDE: Omit<Logement, 'id'> = { ile: 'Tahiti', periode: '', lien_annonce: null, commentaires: null, questions: null }
const PAI_VIDE: Omit<PaiementLog, 'id'> = { description: '', regis: null, isa: null, agathe: null, total: null, date_echeance: null, reste_a_payer: null, lien_reservation: null }

function getIleDef(ile: string) {
  return ILES.find(i => ile?.toLowerCase().includes(i.nom.toLowerCase()))
}

export default function LogementsPage() {
  const [logements, setLogements] = useState<Logement[]>([])
  const [paiements, setPaiements] = useState<PaiementLog[]>([])
  const [chargement, setChargement] = useState(true)
  const [modalLog, setModalLog] = useState<Partial<Logement> | null>(null)
  const [modalPai, setModalPai] = useState<Partial<PaiementLog> | null>(null)
  const [sauvegarde, setSauvegarde] = useState(false)
  const canEdit = useCanEdit()

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
    const { ok } = await apiFetch('/api/logements', { method: modalLog?.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(modalLog) })
    if (ok) { setModalLog(null); await charger() }
    setSauvegarde(false)
  }

  function updatePai(updates: Partial<PaiementLog>) {
    setModalPai(prev => {
      const next = { ...prev, ...updates }
      const toucheFinancier = Object.keys(updates).some(k => CHAMPS_FINANCIERS.includes(k as keyof PaiementLog))
      return toucheFinancier ? { ...next, reste_a_payer: calcReste(next) } : next
    })
  }

  async function sauvegarderPai(e: React.FormEvent) {
    e.preventDefault(); setSauvegarde(true)
    const payload = { ...modalPai, reste_a_payer: calcReste(modalPai ?? {}) }
    const { ok } = await apiFetch('/api/paiements-logements', { method: modalPai?.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (ok) { setModalPai(null); await charger() }
    setSauvegarde(false)
  }

  async function supprimerLog(id: number) {
    if (!confirm('Supprimer ce logement ?')) return
    const { ok } = await apiFetch(`/api/logements?id=${id}`, { method: 'DELETE' })
    if (ok) await charger()
  }
  async function supprimerPai(id: number) {
    if (!confirm('Supprimer ce paiement ?')) return
    const { ok } = await apiFetch(`/api/paiements-logements?id=${id}`, { method: 'DELETE' })
    if (ok) await charger()
  }

  if (chargement) return <div className="flex items-center justify-center h-48 text-slate-400">Chargement...</div>

  return (
    <div>
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Logements</h1>
        <p className="text-slate-400 text-sm mt-0.5">Hébergements et paiements par île</p>
      </div>

      {/* ── Infos pratiques ── */}
      <section className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Infos pratiques</p>
          {canEdit && (
            <button onClick={() => setModalLog({ ...LOG_VIDE })}
              className="text-xs text-sky-600 font-semibold flex items-center gap-1">
              <Plus size={12} /> Ajouter
            </button>
          )}
        </div>
        <div className="space-y-3">
          {logements.length === 0 && (
            <div className="text-center py-8 text-slate-400">Aucun logement saisi</div>
          )}
          {logements.map(l => {
            const ileDef = getIleDef(l.ile)
            return (
              <div key={l.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <div className={`${ileDef?.couleur ?? 'bg-sky-500'} px-4 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{ileDef?.emoji ?? '🏠'}</span>
                    <div>
                      <p className="font-bold text-white">{l.ile}</p>
                      {l.periode && <p className="text-white/70 text-xs">{l.periode}</p>}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button onClick={() => setModalLog({ ...l })} className="p-2 text-white/80 hover:text-white rounded-lg">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => supprimerLog(l.id)} className="p-2 text-white/80 hover:text-white rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="px-4 py-3 space-y-2">
                  {isUrl(l.lien_annonce) && (
                    <a href={l.lien_annonce!} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-sky-600 font-semibold">
                      <ExternalLink size={14} /> Voir l&apos;annonce
                    </a>
                  )}
                  {l.commentaires && (
                    <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 text-sm text-sky-800">
                      💬 {l.commentaires}
                    </div>
                  )}
                  {l.questions && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-800">
                      ❓ {l.questions}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Paiements ── */}
      <section className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paiements</p>
          {canEdit && (
            <button onClick={() => setModalPai({ ...PAI_VIDE })}
              className="text-xs text-sky-600 font-semibold flex items-center gap-1">
              <Plus size={12} /> Ajouter
            </button>
          )}
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {paiements.length === 0 && (
            <div className="text-center py-8 text-slate-400">Aucun paiement saisi</div>
          )}
          {paiements.map(p => {
            const estRegle = !p.reste_a_payer || p.reste_a_payer <= 0
            return (
              <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate text-sm">{p.description}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {estRegle
                      ? <StatusBadge statut="solde" />
                      : <span className="text-sm font-bold text-orange-600">{euros(p.reste_a_payer)}</span>}
                    {p.date_echeance && !estRegle && (
                      <span className="text-xs text-slate-400">⏰ {p.date_echeance}</span>
                    )}
                  </div>
                  {/* Détail par personne */}
                  <div className="flex gap-3 mt-1 text-xs text-slate-400">
                    {[{ n: 'R', v: p.regis }, { n: 'I', v: p.isa }, { n: 'A', v: p.agathe }].map(({ n, v }) => v != null && v > 0 ? (
                      <span key={n}>{n}: {euros(v)}</span>
                    ) : null)}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-slate-800">{euros(p.total)}</p>
                  {canEdit && (
                    <div className="flex gap-1 mt-1 justify-end">
                      <button onClick={() => setModalPai({ ...p })} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => supprimerPai(p.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── MODAL logement ── */}
      {modalLog && (
        <BottomSheet titre={modalLog.id ? 'Modifier le logement' : 'Ajouter un logement'} onClose={() => setModalLog(null)}>
          <form onSubmit={sauvegarderLog} className="space-y-4 pt-2">
            <FormField label="Île" name="ile" type="select" value={modalLog.ile}
              onChange={v => setModalLog(p => ({ ...p, ile: v }))}
              options={ILES.map(i => ({ value: i.nom, label: `${i.emoji} ${i.nom}` }))} />
            <FormField label="Période" name="periode" value={modalLog.periode}
              onChange={v => setModalLog(p => ({ ...p, periode: v }))}
              placeholder="ex: 7-14 sept." />
            <FormField label="Lien annonce" name="lien_annonce" type="url" value={modalLog.lien_annonce ?? ''}
              onChange={v => setModalLog(p => ({ ...p, lien_annonce: v || null }))} />
            <FormField label="Commentaires" name="commentaires" type="textarea" value={modalLog.commentaires ?? ''}
              onChange={v => setModalLog(p => ({ ...p, commentaires: v || null }))} />
            <FormField label="Questions" name="questions" type="textarea" value={modalLog.questions ?? ''}
              onChange={v => setModalLog(p => ({ ...p, questions: v || null }))} />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalLog(null)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold">Annuler</button>
              <button type="submit" disabled={sauvegarde}
                className="flex-1 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 disabled:opacity-50 font-semibold">
                {sauvegarde ? '...' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        </BottomSheet>
      )}

      {/* ── MODAL paiement ── */}
      {modalPai && (
        <BottomSheet titre={modalPai.id ? 'Modifier le paiement' : 'Ajouter un paiement'} onClose={() => setModalPai(null)}>
          <form onSubmit={sauvegarderPai} className="space-y-4 pt-2">
            <FormField label="Description" name="description" value={modalPai.description}
              onChange={v => updatePai({ description: v })} required />
            <FormField label="Prix total (€)" name="total" type="number" value={modalPai.total ?? ''}
              onChange={v => updatePai({ total: v ? Number(v) : null })} />
            <div className="grid grid-cols-3 gap-2">
              <FormField label="Régis (€)" name="regis" type="number" value={modalPai.regis ?? ''}
                onChange={v => updatePai({ regis: v ? Number(v) : null })} />
              <FormField label="Isa (€)" name="isa" type="number" value={modalPai.isa ?? ''}
                onChange={v => updatePai({ isa: v ? Number(v) : null })} />
              <FormField label="Agathe (€)" name="agathe" type="number" value={modalPai.agathe ?? ''}
                onChange={v => updatePai({ agathe: v ? Number(v) : null })} />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center">
              <span className="text-sm text-slate-600">Reste calculé</span>
              <span className={`font-black text-lg ${(calcReste(modalPai) ?? 0) > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                {calcReste(modalPai) === null ? '–' : `${euros(calcReste(modalPai))}${(calcReste(modalPai) ?? 0) <= 0 ? ' ✅' : ''}`}
              </span>
            </div>
            <FormField label="Date échéance" name="date_echeance" value={modalPai.date_echeance ?? ''}
              onChange={v => updatePai({ date_echeance: v || null })} />
            <FormField label="Lien réservation" name="lien_reservation" type="url" value={modalPai.lien_reservation ?? ''}
              onChange={v => updatePai({ lien_reservation: v || null })} />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalPai(null)}
                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold">Annuler</button>
              <button type="submit" disabled={sauvegarde}
                className="flex-1 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 disabled:opacity-50 font-semibold">
                {sauvegarde ? '...' : 'Sauvegarder'}
              </button>
            </div>
          </form>
        </BottomSheet>
      )}
    </div>
  )
}
