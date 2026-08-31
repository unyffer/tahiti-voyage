'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import BottomSheet from '@/components/BottomSheet'
import FormField from '@/components/FormField'
import FAB from '@/components/FAB'
import StatusBadge from '@/components/StatusBadge'
import { ILES } from '@/lib/constants'
import { apiFetch } from '@/lib/toast'
import { useCanEdit } from '@/components/RoleContext'
import { Pencil, Trash2, ChevronRight } from 'lucide-react'

interface Transport {
  id: number; ile: string; nom: string; prix: number | null
  commentaire: string | null; statut: string | null; lien: string | null; gratuit: boolean
}

const VIDE: Omit<Transport, 'id'> = {
  ile: 'Tahiti', nom: '', prix: null, commentaire: null, statut: 'a_faire', lien: null, gratuit: false
}

const TYPE_CONFIG: Record<string, { emoji: string; label: string; bg: string }> = {
  vol:     { emoji: '✈️', label: 'Vols',              bg: 'bg-sky-600' },
  ferry:   { emoji: '🚢', label: 'Ferries & bateaux', bg: 'bg-blue-600' },
  voiture: { emoji: '🚗', label: 'Voitures',          bg: 'bg-amber-500' },
  taxi:    { emoji: '🚕', label: 'Taxis',             bg: 'bg-yellow-500' },
  autre:   { emoji: '🚌', label: 'Autres',            bg: 'bg-slate-500' },
}

function getType(nom: string): string {
  const n = nom.toLowerCase()
  if (n.includes('voiture') || n.includes('location') || n.includes('avis')) return 'voiture'
  if (n.includes('vol') || n.includes('pass inter') || n.includes('paris') || n.includes('papeete') || n.includes('avion')) return 'vol'
  if (n.includes('ferry') || n.includes('express') || n.includes('bateau')) return 'ferry'
  if (n.includes('taxi')) return 'taxi'
  return 'autre'
}

function euros(n: number | null | undefined) {
  if (n == null) return '–'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}


export default function TransportsPage() {
  const [transports, setTransports] = useState<Transport[]>([])
  const [chargement, setChargement] = useState(true)
  const [modal, setModal] = useState<Partial<Transport> | null>(null)
  const [sauvegarde, setSauvegarde] = useState(false)
  const canEdit = useCanEdit()

  const charger = useCallback(async () => {
    const data = await fetch('/api/activites?categorie=transport').then(r => r.json())
    setTransports((data ?? []).filter((a: { categorie: string }) => a.categorie === 'transport'))
    setChargement(false)
  }, [])

  useEffect(() => { charger() }, [charger])

  async function sauvegarder(e: React.FormEvent) {
    e.preventDefault(); setSauvegarde(true)
    const { ok } = await apiFetch('/api/activites', {
      method: modal?.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...modal, categorie: 'transport' })
    })
    if (ok) { setModal(null); await charger() }
    setSauvegarde(false)
  }

  async function supprimer(id: number) {
    if (!confirm('Supprimer ce transport ?')) return
    const { ok } = await apiFetch(`/api/activites?id=${id}`, { method: 'DELETE' })
    if (ok) setTransports(prev => prev.filter(t => t.id !== id))
  }

  if (chargement) return <div className="flex items-center justify-center h-48 text-slate-400">Chargement...</div>

  const total = transports.reduce((s, t) => s + (t.prix ?? 0), 0)
  const reste = transports.filter(t => t.statut !== 'paye').reduce((s, t) => s + (t.prix ?? 0), 0)

  const groupes = ['vol', 'ferry', 'voiture', 'taxi', 'autre'].map(type => ({
    type,
    config: TYPE_CONFIG[type],
    items: transports.filter(t => {
      if (type === 'vol') return getType(t.nom) === 'vol' && !t.nom.startsWith('VT')
      return getType(t.nom) === type
    })
  })).filter(g => g.items.length > 0)

  return (
    <div className="pb-4">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Transports</h1>
        <p className="text-slate-400 text-sm mt-0.5">Vols, ferries, voitures et taxis</p>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-3 px-5 mb-5">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <p className="text-xs text-slate-400">Total transports</p>
          <p className="text-2xl font-black text-slate-900 mt-0.5">{euros(total)}</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
          <p className="text-xs text-orange-500">À régler</p>
          <p className="text-2xl font-black text-orange-600 mt-0.5">{euros(reste)}</p>
        </div>
      </div>

      {/* Groupes par type */}
      <div className="px-5 space-y-4">
        {groupes.map(({ type, config, items }) => (
          <section key={type} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            <div className={`${config.bg} text-white px-4 py-3 flex items-center justify-between`}>
              <span className="font-bold">{config.emoji} {config.label}</span>
              <span className="text-white/70 text-sm">{euros(items.reduce((s, t) => s + (t.prix ?? 0), 0))}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map(t => (
                <div key={t.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">{t.nom}</span>
                      {t.statut && <StatusBadge statut={t.statut} />}
                    </div>
                    {t.commentaire && <p className="text-xs text-slate-500 mt-0.5">{t.commentaire}</p>}
                    {t.lien && (
                      <a href={t.lien} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-sky-600 hover:underline">🔗 Lien</a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {t.prix != null && <span className="font-bold text-slate-800">{euros(t.prix)}</span>}
                    {canEdit && (
                      <>
                        <button onClick={() => setModal(t)} className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg"><Pencil size={14} /></button>
                        <button onClick={() => supprimer(t.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Vols Air Tahiti — lien vers la page dédiée */}
        <Link href="/vols">
          <section className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow active:scale-[.99]">
            <div className="bg-indigo-700 text-white px-4 py-3 flex items-start justify-between">
              <div>
                <p className="font-bold">✈️ Vols Air Tahiti — Pass inter-îles</p>
                <p className="text-indigo-200 text-xs mt-0.5">Haute saison · 585€/pers · ✅ Payé</p>
              </div>
              <span className="font-bold text-white">1 755 €</span>
            </div>
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">5 vols inter-îles · VT211 → VT462</p>
                <p className="text-xs text-slate-400 mt-0.5">Statut live disponible sur la page Vols</p>
              </div>
              <ChevronRight size={18} className="text-slate-300 flex-shrink-0" />
            </div>
          </section>
        </Link>
      </div>

      {/* FAB */}
      {canEdit && <FAB onClick={() => setModal({ ...VIDE })} label="Ajouter" />}

      {/* Modal */}
      {modal && (
        <BottomSheet titre={modal.id ? 'Modifier le transport' : 'Ajouter un transport'} onClose={() => setModal(null)}>
          <form onSubmit={sauvegarder} className="space-y-4 pt-2">
            <FormField label="Nom" name="nom" value={modal.nom}
              onChange={v => setModal(p => ({ ...p, nom: v }))}
              placeholder="ex: Ferry Tahiti → Moorea" required />
            <FormField label="Île concernée" name="ile" type="select" value={modal.ile}
              onChange={v => setModal(p => ({ ...p, ile: v }))}
              options={ILES.map(i => ({ value: i.nom, label: `${i.emoji} ${i.nom}` }))} />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Prix (€)" name="prix" type="number" value={modal.prix ?? ''}
                onChange={v => setModal(p => ({ ...p, prix: v ? Number(v) : null }))} />
              <FormField label="Statut" name="statut" type="select" value={modal.statut ?? ''}
                onChange={v => setModal(p => ({ ...p, statut: v || null }))}
                options={[
                  { value: 'a_faire', label: '⏳ À faire' },
                  { value: 'reserve', label: '📋 Réservé' },
                  { value: 'paye', label: '✅ Payé' },
                ]} />
            </div>
            <FormField label="Commentaire" name="commentaire" type="textarea" value={modal.commentaire ?? ''}
              onChange={v => setModal(p => ({ ...p, commentaire: v || null }))}
              placeholder="Infos pratiques, horaires..." />
            <FormField label="Lien" name="lien" type="url" value={modal.lien ?? ''}
              onChange={v => setModal(p => ({ ...p, lien: v || null }))} />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)}
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
