'use client'

import { useEffect, useState, useCallback } from 'react'

interface ChecklistItem { id: number; item: string; categorie: string; checked: boolean }

const CATEGORIES = ['Mer 🌊', 'Rando 🥾', 'Vêtements 👕', 'Tech 📸', 'Divers 🎲']

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [chargement, setChargement] = useState(true)
  const [ajout, setAjout] = useState(false)
  const [nouvelItem, setNouvelItem] = useState('')
  const [nouvelleCategorie, setNouvelleCategorie] = useState('Divers 🎲')

  const charger = useCallback(async () => {
    const data = await fetch('/api/checklist').then(r => r.json())
    setItems(data ?? [])
    setChargement(false)
  }, [])

  useEffect(() => { charger() }, [charger])

  async function toggle(id: number, checked: boolean) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked } : i))
    await fetch('/api/checklist', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, checked })
    })
  }

  async function ajouter(e: React.FormEvent) {
    e.preventDefault()
    if (!nouvelItem.trim()) return
    const res = await fetch('/api/checklist', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: nouvelItem.trim(), categorie: nouvelleCategorie, checked: false })
    })
    const data = await res.json()
    if (data.id) {
      setItems(prev => [...prev, data])
      setNouvelItem('')
      setAjout(false)
    }
  }

  async function supprimer(id: number) {
    setItems(prev => prev.filter(i => i.id !== id))
    await fetch(`/api/checklist?id=${id}`, { method: 'DELETE' })
  }

  async function toutDecocher() {
    for (const item of items.filter(i => i.checked)) {
      await toggle(item.id, false)
    }
  }

  if (chargement) return <div className="flex items-center justify-center h-48 text-gray-400">Chargement...</div>

  const categories = [...new Set(items.map(i => i.categorie))].sort()
  const nbCoches = items.filter(i => i.checked).length
  const total = items.length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">✅ Checklist</h1>
          <p className="text-gray-500 mt-1">{nbCoches} / {total} items cochés</p>
        </div>
        <div className="flex gap-2">
          {nbCoches > 0 && (
            <button onClick={toutDecocher} className="text-sm text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors">
              Tout décocher
            </button>
          )}
          <button onClick={() => setAjout(!ajout)} className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
            + Ajouter
          </button>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Progression</span>
          <span className="text-sm font-bold text-teal-700">{total > 0 ? Math.round((nbCoches / total) * 100) : 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-teal-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${total > 0 ? (nbCoches / total) * 100 : 0}%` }} />
        </div>
      </div>

      {/* Formulaire ajout */}
      {ajout && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-teal-200">
          <h3 className="font-semibold text-gray-800 mb-3">Nouvel item</h3>
          <form onSubmit={ajouter} className="flex flex-wrap gap-3">
            <input
              type="text" value={nouvelItem} onChange={e => setNouvelItem(e.target.value)}
              placeholder="Nom de l'item..." autoFocus
              className="flex-1 min-w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <select
              value={nouvelleCategorie} onChange={e => setNouvelleCategorie(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">Ajouter</button>
            <button type="button" onClick={() => setAjout(false)} className="text-gray-500 px-4 py-2 rounded-lg text-sm border border-gray-200 hover:bg-gray-50">Annuler</button>
          </form>
        </div>
      )}

      {/* Items par catégorie */}
      {categories.map(cat => {
        const catItems = items.filter(i => i.categorie === cat)
        const catCoches = catItems.filter(i => i.checked).length
        return (
          <div key={cat} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-700">{cat}</h2>
              <span className="text-xs text-gray-500">{catCoches}/{catItems.length}</span>
            </div>
            <div className="divide-y divide-gray-100">
              {catItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group">
                  <label className="flex items-center gap-3 flex-1 cursor-pointer">
                    <input
                      type="checkbox" checked={item.checked} onChange={e => toggle(item.id, e.target.checked)}
                      className="w-5 h-5 rounded text-teal-600 border-gray-300 focus:ring-teal-500"
                    />
                    <span className={`text-sm flex-1 ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.item}
                    </span>
                  </label>
                  <button
                    onClick={() => supprimer(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 rounded text-xs transition-opacity"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {items.length === 0 && !chargement && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">📦</p>
          <p>La checklist est vide — clique &quot;Ajouter&quot; pour commencer !</p>
        </div>
      )}
    </div>
  )
}
