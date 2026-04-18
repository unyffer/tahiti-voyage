'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { ILES } from '@/lib/constants'
import Link from 'next/link'
import Modal from '@/components/Modal'
import FormField from '@/components/FormField'
import { apiFetch } from '@/lib/toast'

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

const STATUT_LABELS: Record<string, string> = {
  a_faire: '⏳ À faire', reserve: '📋 Réservé', paye: '✅ Payé'
}

export default function ActivitesPage() {
  const [activites, setActivites] = useState<Activite[]>([])
  const [chargement, setChargement] = useState(true)
  const [modal, setModal] = useState<Partial<Activite> | null>(null)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [filtreIle, setFiltreIle] = useState<string>('toutes')

  const charger = useCallback(async () => {
    const data = await fetch('/api/activites').then(r => r.json())
    setActivites(data ?? [])
    setChargement(false)
  }, [])

  useEffect(() => { charger() }, [charger])

  async function sauvegarder(e: React.FormEvent) {
    e.preventDefault()
    setSauvegarde(true)
    const payload = {
      ...modal,
      liens: (modal?.liens ?? []).filter(l => l.trim() !== ''),
    }
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

  if (chargement) return <div className="flex items-center justify-center h-48 text-gray-400">Chargement...</div>

  const seulementActivites = activites.filter(a => a.categorie === 'activite')
  const filtrees = filtreIle === 'toutes'
    ? seulementActivites
    : seulementActivites.filter(a => {
        const ile = ILES.find(i => i.slug === filtreIle)
        return a.ile?.toLowerCase().includes(ile?.nom.toLowerCase() ?? '')
      })

  const parIle = ILES.map(ile => ({
    ile,
    acts: seulementActivites.filter(a => a.ile?.toLowerCase().includes(ile.nom.toLowerCase()))
  })).filter(g => g.acts.length > 0 || filtreIle === 'toutes')

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🎯 Activités</h1>
          <p className="text-gray-500 mt-1">Toutes les activités par île</p>
        </div>
        <button
          onClick={() => setModal({ ...VIDE })}
          className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Ajouter une activité
        </button>
      </div>

      {/* Filtre par île */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFiltreIle('toutes')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${filtreIle === 'toutes' ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'}`}
        >
          Toutes les îles
        </button>
        {ILES.map(ile => (
          <button
            key={ile.slug}
            onClick={() => setFiltreIle(ile.slug)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${filtreIle === ile.slug ? 'bg-teal-700 text-white border-teal-700' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'}`}
          >
            {ile.emoji} {ile.nom}
          </button>
        ))}
      </div>

      {parIle.map(({ ile, acts }) => {
        const visibles = filtreIle === 'toutes' ? acts : filtrees.filter(a => a.ile?.toLowerCase().includes(ile.nom.toLowerCase()))
        if (visibles.length === 0 && filtreIle !== 'toutes') return null
        if (acts.length === 0) return null
        return (
          <div key={ile.slug} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`${ile.couleur} px-5 py-3 flex items-center justify-between`}>
              <Link href={`/iles/${ile.slug}`} className="text-white font-semibold text-lg hover:text-white/80">
                {ile.emoji} {ile.nom}
              </Link>
              <button
                onClick={() => setModal({ ...VIDE, ile: ile.nom })}
                className="bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1 rounded-lg transition-colors"
              >
                + Ajouter
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {acts.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3 px-5 py-3 hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800">{a.nom}</span>
                      {a.gratuit && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Gratuit</span>}
                      {a.statut && a.statut !== 'a_faire' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${a.statut === 'paye' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                          {STATUT_LABELS[a.statut]}
                        </span>
                      )}
                    </div>
                    {a.commentaire && <p className="text-sm text-gray-500 mt-0.5">{a.commentaire}</p>}
                    {(a.liens?.length > 0 || a.lien) && (
                      <div className="flex flex-wrap gap-2 mt-0.5">
                        {(a.liens?.length > 0 ? a.liens : a.lien ? [a.lien] : []).map((l, i) => (
                          <a key={i} href={l} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-teal-600 hover:underline">
                            🔗 Lien {a.liens?.length > 1 || (a.liens?.length === 0 && a.lien) ? i + 1 : ''}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {a.prix && <span className="font-semibold text-gray-700 whitespace-nowrap">{euros(a.prix)}</span>}
                    <button onClick={() => setModal({ ...a, liens: a.liens ?? [] })} className="text-teal-600 hover:text-teal-700 p-1" title="Modifier">✏️</button>
                    <button onClick={() => supprimer(a.id)} className="text-red-400 hover:text-red-600 p-1" title="Supprimer">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Modal */}
      {modal && (
        <Modal titre={modal.id ? 'Modifier l\'activité' : 'Ajouter une activité'} onClose={() => setModal(null)}>
          <form onSubmit={sauvegarder} className="space-y-4">
            <FormField label="Île" name="ile" type="select" value={modal.ile} onChange={(v) => setModal(p => ({ ...p, ile: v }))}
              options={ILES.map(i => ({ value: i.nom, label: `${i.emoji} ${i.nom}` }))} required />
            <FormField label="Nom de l'activité" name="nom" value={modal.nom} onChange={(v) => setModal(p => ({ ...p, nom: v }))} required />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Prix total (€)" name="prix" type="number" value={modal.prix ?? ''} onChange={(v) => setModal(p => ({ ...p, prix: v ? Number(v) : null }))} />
              <FormField label="Statut" name="statut" type="select" value={modal.statut ?? ''} onChange={(v) => setModal(p => ({ ...p, statut: v || null }))}
                options={[{ value: 'a_faire', label: '⏳ À faire' }, { value: 'reserve', label: '📋 Réservé' }, { value: 'paye', label: '✅ Payé' }]} />
            </div>
            <FormField label="Commentaire" name="commentaire" type="textarea" value={modal.commentaire ?? ''} onChange={(v) => setModal(p => ({ ...p, commentaire: v || null }))} />
            {/* Liens multiples */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Liens</label>
              <div className="space-y-2">
                {(modal.liens ?? []).map((lien, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="url"
                      value={lien}
                      onChange={(e) => setModal(p => {
                        const liens = [...(p?.liens ?? [])]
                        liens[i] = e.target.value
                        return { ...p, liens }
                      })}
                      placeholder="https://..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setModal(p => {
                        const liens = (p?.liens ?? []).filter((_, j) => j !== i)
                        return { ...p, liens }
                      })}
                      className="text-red-400 hover:text-red-600 px-2"
                      title="Supprimer ce lien"
                    >✕</button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setModal(p => ({ ...p, liens: [...(p?.liens ?? []), ''] }))}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  + Ajouter un lien
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={modal.gratuit ?? false} onChange={(e) => setModal(p => ({ ...p, gratuit: e.target.checked }))}
                className="w-4 h-4 rounded text-teal-600" />
              <span className="text-sm text-gray-700">Activité gratuite</span>
            </label>
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
