'use client'

import { useEffect, useState, useCallback } from 'react'
import { apiFetch } from '@/lib/toast'
import { useCanEdit } from '@/components/RoleContext'
import { Pencil, Trash2, Plus, X, Check } from 'lucide-react'

interface ChecklistItem { id: number; item: string; categorie: string; checked: boolean; personne: string }

const CATEGORIES_DEFAUT = ['Mer 🌊', 'Rando 🥾', 'Vêtements 👕', 'Tech 📸', 'Divers 🎲']
const PERSONNES = ['Commun', 'Régis', 'Isa', 'Agathe'] as const
type Personne = typeof PERSONNES[number]

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
  const canEdit = useCanEdit()

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

  const categoriesDisponibles = [...new Set([...CATEGORIES_DEFAUT, ...items.map(i => i.categorie)])].sort()

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
    const cat = editCat === '__nouvelle__' ? '' : editCat
    const { ok } = await apiFetch('/api/checklist', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, item: editNom.trim(), ...(cat ? { categorie: cat } : {}) })
    })
    if (ok) {
      setItems(prev => prev.map(i => i.id === id ? { ...i, item: editNom.trim(), ...(cat ? { categorie: cat } : {}) } : i))
      setEditId(null)
    }
  }

  async function supprimer(id: number) {
    if (!confirm('Supprimer cet item ?')) return
    const { ok } = await apiFetch(`/api/checklist?id=${id}`, { method: 'DELETE' })
    if (ok) setItems(prev => prev.filter(i => i.id !== id))
  }

  if (chargement) return <div className="flex items-center justify-center h-48 text-slate-400">Chargement...</div>

  const itemsFiltres = items.filter(i => (i.personne ?? 'Commun') === onglet)
  const categories = [...new Set(itemsFiltres.map(i => i.categorie))].sort()
  const nbCoches = itemsFiltres.filter(i => i.checked).length
  const total = itemsFiltres.length

  const statsParPersonne = PERSONNES.reduce((acc, p) => {
    const its = items.filter(i => (i.personne ?? 'Commun') === p)
    acc[p] = { total: its.length, coches: its.filter(i => i.checked).length }
    return acc
  }, {} as Record<Personne, { total: number; coches: number }>)

  return (
    <div>
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Checklist</h1>
        <p className="text-slate-400 text-sm mt-0.5">Liste à emporter — par personne</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-0 border-b border-slate-100 px-5 overflow-x-auto no-scrollbar mb-0">
        {PERSONNES.map(p => {
          const s = statsParPersonne[p]
          return (
            <button key={p} onClick={() => setOnglet(p)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                onglet === p ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <span>{p}</span>
              {s.total > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  s.coches === s.total ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {s.coches}/{s.total}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Barre de progression + actions */}
      <div className="px-5 py-3 flex items-center gap-3 border-b border-slate-100">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all"
            style={{ width: `${total > 0 ? (nbCoches / total) * 100 : 0}%` }} />
        </div>
        <span className="text-sm font-bold text-slate-700">
          {total > 0 ? Math.round((nbCoches / total) * 100) : 0}%
        </span>
        {canEdit && (
          <button onClick={() => setAjout(!ajout)}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs px-3 py-2 rounded-xl font-semibold transition-colors">
            <Plus size={14} /> Ajouter
          </button>
        )}
      </div>

      {/* Formulaire ajout */}
      {ajout && canEdit && (
        <div className="px-5 py-4 bg-sky-50 border-b border-sky-100">
          <form onSubmit={ajouter} className="space-y-3">
            <input type="text" value={nouvelItem} onChange={e => setNouvelItem(e.target.value)}
              placeholder={`Item pour ${onglet}...`} autoFocus
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm" />
            <div className="flex gap-2">
              <select value={nouvelleCategorie} onChange={e => setNouvelleCategorie(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm">
                {categoriesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__nouvelle__">✏️ Nouvelle catégorie...</option>
              </select>
              <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded-xl text-sm font-semibold">Ajouter</button>
              <button type="button" onClick={() => setAjout(false)}
                className="text-slate-400 p-2 rounded-xl border border-slate-200"><X size={16} /></button>
            </div>
            {nouvelleCategorie === '__nouvelle__' && (
              <input type="text" value={nouvelleCatCustom} onChange={e => setNouvelleCatCustom(e.target.value)}
                placeholder="Nom de la catégorie..."
                className="w-full border border-sky-300 rounded-xl px-3 py-2 text-sm" />
            )}
          </form>
        </div>
      )}

      {/* Items par catégorie */}
      {categories.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-semibold text-slate-500">{onglet === 'Commun' ? 'Aucun item commun' : `Aucun item pour ${onglet}`}</p>
          <p className="text-sm mt-1">Clique &quot;+ Ajouter&quot; pour créer un item.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {categories.map(cat => {
            const catItems = itemsFiltres.filter(i => i.categorie === cat)
            const catCoches = catItems.filter(i => i.checked).length
            return (
              <div key={cat}>
                <div className="px-5 py-2 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{cat}</span>
                  <span className="text-xs text-slate-400">{catCoches}/{catItems.length}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {catItems.map(item => (
                    <div key={item.id} className="px-5 py-3">
                      {editId === item.id ? (
                        <div className="flex items-center gap-2">
                          <input type="text" value={editNom} autoFocus
                            onChange={e => setEditNom(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') sauvegarderEdit(item.id); if (e.key === 'Escape') setEditId(null) }}
                            className="flex-1 border border-sky-400 rounded-xl px-3 py-2 text-sm" />
                          <select value={editCat} onChange={e => setEditCat(e.target.value)}
                            className="border border-slate-200 rounded-xl px-2 py-2 text-xs">
                            {categoriesDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <button onClick={() => sauvegarderEdit(item.id)}
                            className="p-2 bg-sky-600 text-white rounded-lg"><Check size={14} /></button>
                          <button onClick={() => setEditId(null)}
                            className="p-2 text-slate-400 border border-slate-200 rounded-lg"><X size={14} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button onClick={() => toggle(item.id, !item.checked)}
                            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              item.checked
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-300 hover:border-sky-400'
                            }`}>
                            {item.checked && <Check size={12} strokeWidth={3} />}
                          </button>
                          <span className={`flex-1 text-sm ${item.checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {item.item}
                          </span>
                          {canEdit && (
                            <div className="flex gap-1">
                              <button onClick={() => { setEditId(item.id); setEditNom(item.item); setEditCat(item.categorie) }}
                                className="p-2 text-sky-500 hover:bg-sky-50 rounded-lg"><Pencil size={13} /></button>
                              <button onClick={() => supprimer(item.id)}
                                className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
