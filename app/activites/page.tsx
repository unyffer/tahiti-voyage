'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { ILES } from '@/lib/constants'
import Link from 'next/link'
import BottomSheet from '@/components/BottomSheet'
import FormField from '@/components/FormField'
import FAB from '@/components/FAB'
import StatusBadge from '@/components/StatusBadge'
import { apiFetch } from '@/lib/toast'
import { useCanEdit } from '@/components/RoleContext'
import { Pencil, Trash2 } from 'lucide-react'

interface Activite {
  id: number; ile: string; categorie: string; nom: string; prix: number | null
  lien: string | null; liens: string[]; commentaire: string | null; gratuit: boolean; statut: string | null
}

const VIDE: Omit<Activite, 'id'> = {
  ile: 'Tahiti', categorie: 'activite', nom: '', prix: null,
  lien: null, liens: [], commentaire: null, gratuit: false, statut: 'a_faire'
}

function euros(n: number | null | undefined) {
  if (n == null) return ''
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

export default function ActivitesPage() {
  const [activites, setActivites] = useState<Activite[]>([])
  const [chargement, setChargement] = useState(true)
  const [modal, setModal] = useState<Partial<Activite> | null>(null)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [filtreIle, setFiltreIle] = useState<string>('toutes')
  const canEdit = useCanEdit()

  const charger = useCallback(async () => {
    const data = await fetch('/api/activites').then(r => r.json())
    setActivites(data ?? [])
    setChargement(false)
  }, [])

  useEffect(() => { charger() }, [charger])

  async function sauvegarder(e: React.FormEvent) {
    e.preventDefault()
    setSauvegarde(true)
    const payload = { ...modal, liens: (modal?.liens ?? []).filter(l => l.trim() !== '') }
    const { ok } = await apiFetch('/api/activites', {
      method: modal?.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (ok) { setModal(null); await charger() }
    setSauvegarde(false)
  }

  async function supprimer(id: number) {
    if (!confirm('Supprimer cette activité ?')) return
    const { ok } = await apiFetch(`/api/activites?id=${id}`, { method: 'DELETE' })
    if (ok) await charger()
  }

  if (chargement) return <div className="flex items-center justify-center h-48 text-slate-400">Chargement...</div>

  const seulementActivites = activites.filter(a => a.categorie === 'activite')

  const groupes = ILES.map(ile => ({
    ile,
    acts: seulementActivites.filter(a => a.ile?.toLowerCase().includes(ile.nom.toLowerCase()))
  })).filter(g => {
    if (filtreIle === 'toutes') return g.acts.length > 0
    return g.ile.slug === filtreIle && g.acts.length > 0
  })

  return (
    <div className="pb-4">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Activités</h1>
        <p className="text-slate-400 text-sm mt-0.5">Toutes les activités par île</p>
      </div>

      {/* Filtre îles — scroll horizontal */}
      <div className="flex gap-2 px-5 overflow-x-auto no-scrollbar pb-4">
        <button
          onClick={() => setFiltreIle('toutes')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
            filtreIle === 'toutes' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-500 border-slate-200'
          }`}
        >
          Toutes
        </button>
        {ILES.map(ile => (
          <button
            key={ile.slug}
            onClick={() => setFiltreIle(ile.slug)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
              filtreIle === ile.slug ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-500 border-slate-200'
            }`}
          >
            {ile.emoji} {ile.nom}
          </button>
        ))}
      </div>

      {/* Groupes par île */}
      <div className="px-5 space-y-4">
        {groupes.map(({ ile, acts }) => {
          const confirmees = acts.filter(a => a.statut === 'reserve' || a.statut === 'paye')
          const idees = acts.filter(a => !a.statut || a.statut === 'a_faire')

          return (
            <div key={ile.slug} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              {/* Header île */}
              <div className={`${ile.couleur} px-4 py-3 flex items-center justify-between`}>
                <Link href={`/iles/${ile.slug}`} className="flex items-center gap-2 text-white font-bold">
                  <span className="text-xl">{ile.emoji}</span>
                  <span>{ile.nom}</span>
                  <span className="text-white/60 text-xs font-normal ml-1">{acts.length} activités</span>
                </Link>
                {canEdit && (
                  <button onClick={() => setModal({ ...VIDE, ile: ile.nom })}
                    className="text-white/80 hover:text-white text-sm font-semibold bg-white/15 hover:bg-white/25 px-3 py-1 rounded-full transition-all">
                    + Ajouter
                  </button>
                )}
              </div>

              {/* Confirmées */}
              {confirmees.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100">
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">✅ Confirmées · {confirmees.length}</span>
                  </div>
                  {confirmees.map(a => (
                    <div key={a.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm">{a.nom}</span>
                          <StatusBadge statut={a.statut} />
                        </div>
                        {a.commentaire && <p className="text-xs text-slate-500 mt-0.5 truncate">{a.commentaire}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {a.prix && <span className="font-bold text-slate-800 text-sm">{euros(a.prix)}</span>}
                        {canEdit && (
                          <>
                            <button onClick={() => setModal({ ...a, liens: a.liens ?? [] })}
                              className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg"><Pencil size={14} /></button>
                            <button onClick={() => supprimer(a.id)}
                              className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Idées */}
              {idees.length > 0 && (
                <>
                  {confirmees.length > 0 && (
                    <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">💡 Idées · {idees.length}</span>
                    </div>
                  )}
                  {idees.map(a => (
                    <div key={a.id} className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm">{a.nom}</span>
                          {a.gratuit && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Gratuit</span>}
                        </div>
                        {a.commentaire && <p className="text-xs text-slate-500 mt-0.5">{a.commentaire}</p>}
                        {(a.liens?.length > 0 || a.lien) && (
                          <div className="flex flex-wrap gap-2 mt-0.5">
                            {(a.liens?.length > 0 ? a.liens : a.lien ? [a.lien] : []).map((l, i) => (
                              <a key={i} href={l} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-sky-600 hover:underline">🔗 Lien {i + 1}</a>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {a.prix && <span className="font-bold text-slate-700 text-sm">{euros(a.prix)}</span>}
                        {canEdit && (
                          <>
                            <button onClick={() => setModal({ ...a, liens: a.liens ?? [] })}
                              className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg"><Pencil size={14} /></button>
                            <button onClick={() => supprimer(a.id)}
                              className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* FAB */}
      {canEdit && <FAB onClick={() => setModal({ ...VIDE })} label="Ajouter" />}

      {/* Modal */}
      {modal && (
        <BottomSheet titre={modal.id ? "Modifier l'activité" : 'Ajouter une activité'} onClose={() => setModal(null)}>
          <form onSubmit={sauvegarder} className="space-y-4 pt-2">
            <FormField label="Île" name="ile" type="select" value={modal.ile}
              onChange={v => setModal(p => ({ ...p, ile: v }))}
              options={ILES.map(i => ({ value: i.nom, label: `${i.emoji} ${i.nom}` }))} required />
            <FormField label="Nom de l'activité" name="nom" value={modal.nom}
              onChange={v => setModal(p => ({ ...p, nom: v }))} required />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Prix total (€)" name="prix" type="number" value={modal.prix ?? ''}
                onChange={v => setModal(p => ({ ...p, prix: v ? Number(v) : null }))} />
              <FormField label="Statut" name="statut" type="select" value={modal.statut ?? ''}
                onChange={v => setModal(p => ({ ...p, statut: v || null }))}
                options={[
                  { value: 'a_faire', label: '💡 Idée' },
                  { value: 'reserve', label: '📋 Réservé' },
                  { value: 'paye', label: '✅ Payé' },
                ]} />
            </div>
            <FormField label="Commentaire" name="commentaire" type="textarea" value={modal.commentaire ?? ''}
              onChange={v => setModal(p => ({ ...p, commentaire: v || null }))} />
            {/* Liens */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Liens</label>
              <div className="space-y-2">
                {(modal.liens ?? []).map((lien, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="url" value={lien}
                      onChange={(e) => setModal(p => {
                        const liens = [...(p?.liens ?? [])]; liens[i] = e.target.value
                        return { ...p, liens }
                      })}
                      placeholder="https://..."
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm" />
                    <button type="button"
                      onClick={() => setModal(p => ({ ...p, liens: (p?.liens ?? []).filter((_, j) => j !== i) }))}
                      className="text-red-400 hover:text-red-600 px-2">✕</button>
                  </div>
                ))}
                <button type="button"
                  onClick={() => setModal(p => ({ ...p, liens: [...(p?.liens ?? []), ''] }))}
                  className="text-sm text-sky-600 font-semibold">+ Ajouter un lien</button>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={modal.gratuit ?? false}
                onChange={(e) => setModal(p => ({ ...p, gratuit: e.target.checked }))}
                className="w-5 h-5 rounded text-sky-600" />
              <span className="text-sm font-semibold text-slate-700">Activité gratuite</span>
            </label>
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
