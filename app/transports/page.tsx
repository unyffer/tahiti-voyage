'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import Modal from '@/components/Modal'
import FormField from '@/components/FormField'
import { ILES } from '@/lib/constants'

interface Transport {
  id: number; ile: string; nom: string; prix: number | null
  commentaire: string | null; statut: string | null; lien: string | null; gratuit: boolean
}

const VIDE: Omit<Transport, 'id'> = {
  ile: 'Tahiti', nom: '', prix: null, commentaire: null, statut: 'a_faire', lien: null, gratuit: false
}

const TYPE_CONFIG: Record<string, { emoji: string; label: string; couleur: string }> = {
  vol:     { emoji: '✈️', label: 'Vols',              couleur: 'bg-sky-600' },
  ferry:   { emoji: '🚢', label: 'Ferries & bateaux', couleur: 'bg-blue-600' },
  voiture: { emoji: '🚗', label: 'Voitures',          couleur: 'bg-amber-600' },
  taxi:    { emoji: '🚕', label: 'Taxis',             couleur: 'bg-yellow-500' },
  autre:   { emoji: '🚌', label: 'Autres',            couleur: 'bg-gray-600' },
}

function getType(nom: string): string {
  const n = nom.toLowerCase()
  if (n.includes('vol') || n.includes('pass inter') || n.includes('paris') || n.includes('papeete') || n.includes('avion')) return 'vol'
  if (n.includes('ferry') || n.includes('express') || n.includes('bateau')) return 'ferry'
  if (n.includes('voiture') || n.includes('location') || n.includes('avis')) return 'voiture'
  if (n.includes('taxi')) return 'taxi'
  return 'autre'
}

function euros(n: number | null | undefined) {
  if (n == null) return '–'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

const STATUT_STYLE: Record<string, string> = {
  paye: 'bg-emerald-100 text-emerald-700',
  reserve: 'bg-blue-100 text-blue-700',
  a_faire: 'bg-orange-100 text-orange-700',
}
const STATUT_LABEL: Record<string, string> = {
  paye: '✅ Payé', reserve: '📋 Réservé', a_faire: '⏳ À faire'
}

export default function TransportsPage() {
  const [transports, setTransports] = useState<Transport[]>([])
  const [chargement, setChargement] = useState(true)
  const [modal, setModal] = useState<Partial<Transport> | null>(null)
  const [sauvegarde, setSauvegarde] = useState(false)

  const charger = useCallback(async () => {
    const data = await fetch('/api/activites?categorie=transport').then(r => r.json())
    setTransports((data ?? []).filter((a: { categorie: string }) => a.categorie === 'transport'))
    setChargement(false)
  }, [])

  useEffect(() => { charger() }, [charger])

  async function sauvegarder(e: React.FormEvent) {
    e.preventDefault()
    setSauvegarde(true)
    const payload = { ...modal, categorie: 'transport' }
    const method = modal?.id ? 'PATCH' : 'POST'
    await fetch('/api/activites', {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    setModal(null)
    await charger()
    setSauvegarde(false)
  }

  async function supprimer(id: number) {
    if (!confirm('Supprimer ce transport ?')) return
    await fetch(`/api/activites?id=${id}`, { method: 'DELETE' })
    setTransports(prev => prev.filter(t => t.id !== id))
  }

  if (chargement) return <div className="flex items-center justify-center h-48 text-gray-400">Chargement...</div>

  const total = transports.reduce((s, t) => s + (t.prix ?? 0), 0)
  const reste = transports.filter(t => t.statut !== 'paye').reduce((s, t) => s + (t.prix ?? 0), 0)

  // Grouper par type
  const groupes = ['vol', 'ferry', 'voiture', 'taxi', 'autre'].map(type => ({
    type,
    config: TYPE_CONFIG[type],
    items: transports.filter(t => getType(t.nom) === type)
  })).filter(g => g.items.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">✈️ Transports</h1>
          <p className="text-gray-500 mt-1">Vols, ferries, voitures et taxis</p>
        </div>
        <button
          onClick={() => setModal({ ...VIDE })}
          className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Ajouter un transport
        </button>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total transports</p>
          <p className="text-2xl font-bold text-gray-800">{euros(total)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Reste à régler</p>
          <p className="text-2xl font-bold text-orange-500">{euros(reste)}</p>
        </div>
      </div>

      {/* Groupes par type */}
      {groupes.map(({ type, config, items }) => (
        <section key={type} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className={`${config.couleur} text-white px-5 py-3 flex items-center justify-between`}>
            <h2 className="font-semibold text-lg">{config.emoji} {config.label}</h2>
            <span className="text-white/70 text-sm">
              {euros(items.reduce((s, t) => s + (t.prix ?? 0), 0))}
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {items.map((t) => (
              <div key={t.id} className="flex items-start justify-between gap-3 px-5 py-4 hover:bg-gray-50 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-800">{t.nom}</span>
                    {t.statut && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUT_STYLE[t.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUT_LABEL[t.statut] ?? t.statut}
                      </span>
                    )}
                  </div>
                  {t.commentaire && (
                    <p className="text-sm text-gray-500 mt-0.5">{t.commentaire}</p>
                  )}
                  {t.lien && (
                    <a href={t.lien} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline">🔗 Lien</a>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {t.prix != null && <span className="font-bold text-gray-800">{euros(t.prix)}</span>}
                  <button onClick={() => setModal(t)} className="text-teal-600 hover:text-teal-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Modifier">✏️</button>
                  <button onClick={() => supprimer(t.id)} className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity" title="Supprimer">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {transports.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">✈️</p>
          <p>Lance le SQL <code>seed-transports.sql</code> dans Supabase pour charger les données !</p>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal titre={modal.id ? 'Modifier le transport' : 'Ajouter un transport'} onClose={() => setModal(null)}>
          <form onSubmit={sauvegarder} className="space-y-4">
            <FormField label="Nom" name="nom" value={modal.nom} onChange={(v) => setModal(p => ({ ...p, nom: v }))}
              placeholder="ex: Ferry Tahiti → Moorea" required />
            <FormField label="Île concernée" name="ile" type="select" value={modal.ile}
              onChange={(v) => setModal(p => ({ ...p, ile: v }))}
              options={ILES.map(i => ({ value: i.nom, label: `${i.emoji} ${i.nom}` }))} />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Prix (€)" name="prix" type="number" value={modal.prix ?? ''}
                onChange={(v) => setModal(p => ({ ...p, prix: v ? Number(v) : null }))} />
              <FormField label="Statut" name="statut" type="select" value={modal.statut ?? ''}
                onChange={(v) => setModal(p => ({ ...p, statut: v || null }))}
                options={[
                  { value: 'a_faire', label: '⏳ À faire' },
                  { value: 'reserve', label: '📋 Réservé' },
                  { value: 'paye', label: '✅ Payé' },
                ]} />
            </div>
            <FormField label="Commentaire" name="commentaire" type="textarea" value={modal.commentaire ?? ''}
              onChange={(v) => setModal(p => ({ ...p, commentaire: v || null }))}
              placeholder="Infos pratiques, horaires, remarques..." />
            <FormField label="Lien (optionnel)" name="lien" type="url" value={modal.lien ?? ''}
              onChange={(v) => setModal(p => ({ ...p, lien: v || null }))} />
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
