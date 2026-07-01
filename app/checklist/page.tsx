'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/toast'

interface ChecklistItem { id: number; item: string; categorie: string; checked: boolean; personne: string }

const CATEGORIES_DEFAUT = ['Mer 🌊', 'Rando 🥾', 'Vêtements 👕', 'Tech 📸', 'Divers 🎲']
const PERSONNES = ['Commun', 'Régis', 'Isa', 'Agathe'] as const
type Personne = typeof PERSONNES[number]

const PERSONNE_EMOJI: Record<Personne, string> = {
  Commun: '👥', Régis: '👤', Isa: '👤', Agathe: '👤'
}

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [chargement, setChargement] = useState(true)
  const [onglet, setOnglet] = useState<Personne>('Commun')
  const [ajout, setAjout] = useState(false)
  const [nouvelItem, setNouvelItem] = useState('')
  const [nouvelleCategorie, setNouvelleCategorie] = useState('Divers 🎲')
  const [nouvelleCatCustom, setNouvelleCatCustom] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [editNom, setEditNom] = useState('')
  const [editCat, setEditCat] = useState('')
  const [editCatCustom, setEditCatCustom] = useState('')

  const charger = useCallback(async () => {
    const data = await fetch('/api/checklist').then(r => r.json())
    setItems(data ?? [])
    setChargement(false)
  }, [])

  useEffect(() => { charger() }, [charger])

  async function toggle(id: number, checked: boolean) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked } : i))
    const { ok } = await apiFetch('/api/checklist', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, checked })
    })
    if (!ok) setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !checked } : i))
  }

  // Catégories dynamiques = défaut + toutes celles déjà utilisées
  const categoriesDisponibles = [
    ...new Set([...CATEGORIES_DEFAUT, ...items.map(i => i.categorie)])
  ].sort()

  async function ajouter(e: React.FormEvent) {
    e.preventDefault()
    if (!nouvelItem.trim()) return
    const cat = nouvelleCategorie === '__nouvelle__' ? nouvelleCatCustom.trim() : nouvelleCategorie
    if (!cat) return
    const { ok, data } = await apiFetch('/api/checklist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: nouvelItem.trim(), categorie: cat, checked: false, personne: onglet })
    })
    if (ok && data && (data as ChecklistItem).id) {
      setItems(prev => [...prev, data as ChecklistItem])
      setNouvelItem(''); setNouvelleCatCustom(''); setAjout(false)
    }
  }

  async function sauvegarderEdit(id: number) {
    if (!editNom.trim()) { setEditId(null); return }
    const cat = editCat === '__nouvelle__' ? editCatCustom.trim() : editCat
    const updates: Record<string, string> = { item: editNom.trim() }
    if (cat) updates.categorie = cat
    const { ok } = await apiFetch('/api/checklist', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    })
    if (ok) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, item: editNom.trim(), ...(cat ? { categorie: cat } : {}) } : i))
      setEditId(null)
    }
  }

  async function supprimer(id: number) {
    if (!confirm('Supprimer cet item définitivement ?')) return
    const { ok } = await apiFetch(`/api/checklist?id=${id}`, { method: 'DELETE' })
    if (ok) setItems(prev => prev.filter(i => i.id !== id))
  }

  async function toutDecocher() {
    for (const item of itemsFiltres.filter(i => i.checked)) await toggle(item.id, false)
  }

  if (chargement) return <div className="flex items-center justify-center h-48 text-gray-400">Chargement...</div>

  const itemsFiltres = items.filter(i => (i.personne ?? 'Commun') === onglet)
  const categories = [...new Set(itemsFiltres.map(i => i.categorie))].sort()
  const nbCoches = itemsFiltres.filter(i => i.checked).length
  const total = itemsFiltres.length

  // Stats par personne pour les badges
  const statsParPersonne = PERSONNES.reduce((acc, p) => {
    const its = items.filter(i => (i.personne ?? 'Commun') === p)
    acc[p] = { total: its.length, coches: its.filter(i => i.checked).length }
    return acc
  }, {} as Record<Personne, { total: number; coches: number }>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">✅ Checklist</h1>
        <p className="text-gray-500 mt-1">Liste à emporter — par personne</p>
      </div>

      {/* Onglets par personne */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {PERSONNES.map((p) => {
            const s = statsParPersonne[p]
            return (
              <button key={p} onClick={() => setOnglet(p)}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                  onglet === p
                    ? 'border-teal-600 text-teal-700 bg-teal-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{PERSONNE_EMOJI[p]}</span>
                <span>{p}</span>
                {s.total > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    s.coches === s.total ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {s.coches}/{s.total}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Barre de progression */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div className="bg-teal-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${total > 0 ? (nbCoches / total) * 100 : 0}%` }} />
          </div>
          <span className="text-sm font-semibold text-teal-700 w-16 text-right">
            {total > 0 ? Math.round((nbCoches / total) * 100) : 0}%
          </span>
          {nbCoches > 0 && (
            <button onClick={toutDecocher} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
              Décocher
            </button>
          )}
          <button onClick={() => setAjout(!ajout)}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors">
            + Ajouter
          </button>
        </div>

        {/* Formulaire ajout */}
        {ajout && (
          <div className="px-5 py-4 bg-teal-50 border-b border-teal-100 space-y-2">
            <form onSubmit={ajouter} className="flex flex-wrap gap-3">
              <input type="text" value={nouvelItem} onChange={e => setNouvelItem(e.target.value)}
                placeholder={`Item pour ${onglet}...`} autoFocus
                className="flex-1 min-w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <select value={nouvelleCategorie} onChange={e => setNouvelleCategorie(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                {categoriesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__nouvelle__">✏️ Nouvelle catégorie...</option>
              </select>
              {nouvelleCategorie === '__nouvelle__' && (
                <input type="text" value={nouvelleCatCustom} onChange={e => setNouvelleCatCustom(e.target.value)}
                  placeholder="Nom de la catégorie..."
                  className="border border-teal-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              )}
              <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">Ajouter</button>
              <button type="button" onClick={() => setAjout(false)} className="text-gray-500 px-3 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50">✕</button>
            </form>
          </div>
        )}

        {/* Items */}
        {categories.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">{PERSONNE_EMOJI[onglet]}</p>
            <p className="font-medium text-gray-500">{onglet === 'Commun' ? 'Aucun item commun' : `Aucun item pour ${onglet}`}</p>
            <p className="text-sm mt-1">Clique &quot;+ Ajouter&quot; pour créer un item dans cet onglet.</p>
          </div>
        ) : (
          categories.map(cat => {
            const catItems = itemsFiltres.filter(i => i.categorie === cat)
            const catCoches = catItems.filter(i => i.checked).length
            return (
              <div key={cat}>
                <div className="bg-gray-50 border-b border-gray-200 px-5 py-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-600">{cat}</h2>
                  <span className="text-xs text-gray-400">{catCoches}/{catItems.length}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {catItems.map(item => (
                    <div key={item.id} className="px-5 py-2 hover:bg-gray-50 group">
                      {editId === item.id ? (
                        /* Mode édition — nom + catégorie */
                        <div className="flex flex-wrap gap-2 items-center py-1">
                          <input type="text" value={editNom} autoFocus
                            onChange={e => setEditNom(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') sauvegarderEdit(item.id); if (e.key === 'Escape') setEditId(null) }}
                            className="flex-1 min-w-32 border border-teal-400 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                          <select value={editCat} onChange={e => setEditCat(e.target.value)}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500">
                            {categoriesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                            <option value="__nouvelle__">✏️ Nouvelle...</option>
                          </select>
                          {editCat === '__nouvelle__' && (
                            <input type="text" value={editCatCustom} onChange={e => setEditCatCustom(e.target.value)}
                              placeholder="Nom de la catégorie..."
                              className="border border-teal-400 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500" />
                          )}
                          <button onClick={() => sauvegarderEdit(item.id)} className="bg-teal-600 text-white px-2 py-1 rounded text-xs font-medium">✓</button>
                          <button onClick={() => setEditId(null)} className="text-gray-400 px-2 py-1 rounded text-xs border border-gray-200">✕</button>
                        </div>
                      ) : (
                        /* Mode affichage */
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={item.checked} onChange={e => toggle(item.id, e.target.checked)}
                            className="w-5 h-5 rounded text-teal-600 border-gray-300 focus:ring-teal-500 flex-shrink-0" />
                          <span onDoubleClick={() => { setEditId(item.id); setEditNom(item.item); setEditCat(item.categorie); setEditCatCustom('') }}
                            className={`flex-1 text-sm cursor-pointer ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {item.item}
                          </span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setEditId(item.id); setEditNom(item.item); setEditCat(item.categorie); setEditCatCustom('') }}
                              className="text-teal-400 hover:text-teal-600 p-1.5 rounded-lg hover:bg-teal-50 transition-colors text-sm" title="Modifier">✏️</button>
                            <button onClick={() => supprimer(item.id)}
                              className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors text-sm" title="Supprimer">🗑️</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
