'use client'

import { useEffect, useState } from 'react'

interface ChecklistItem {
  id: number
  item: string
  categorie: string
  checked: boolean
}

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    fetch('/api/checklist')
      .then((r) => r.json())
      .then((data) => {
        setItems(data ?? [])
        setChargement(false)
      })
  }, [])

  async function toggle(id: number, checked: boolean) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked } : i)))
    await fetch('/api/checklist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, checked }),
    })
  }

  async function toutDecocher() {
    for (const item of items.filter((i) => i.checked)) {
      await toggle(item.id, false)
    }
  }

  if (chargement) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        Chargement...
      </div>
    )
  }

  const categories = [...new Set(items.map((i) => i.categorie))].sort()
  const nbCoches = items.filter((i) => i.checked).length
  const total = items.length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">✅ Checklist</h1>
          <p className="text-gray-500 mt-1">
            {nbCoches} / {total} items cochés
          </p>
        </div>
        {nbCoches > 0 && (
          <button
            onClick={toutDecocher}
            className="text-sm text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            Tout décocher
          </button>
        )}
      </div>

      {/* Barre de progression */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Progression</span>
          <span className="text-sm font-bold text-teal-700">
            {total > 0 ? Math.round((nbCoches / total) * 100) : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-teal-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${total > 0 ? (nbCoches / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Items par catégorie */}
      {categories.map((cat) => {
        const catItems = items.filter((i) => i.categorie === cat)
        const catCoches = catItems.filter((i) => i.checked).length
        return (
          <div key={cat} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-700 capitalize">{cat}</h2>
              <span className="text-xs text-gray-500">
                {catCoches}/{catItems.length}
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {catItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => toggle(item.id, e.target.checked)}
                    className="w-5 h-5 rounded text-teal-600 border-gray-300 focus:ring-teal-500"
                  />
                  <span
                    className={`flex-1 text-sm ${
                      item.checked ? 'line-through text-gray-400' : 'text-gray-800'
                    }`}
                  >
                    {item.item}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )
      })}

      {items.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">📦</p>
          <p>La checklist est vide — lance le script d&apos;import pour la remplir !</p>
        </div>
      )}
    </div>
  )
}
