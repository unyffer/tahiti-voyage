'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function euros(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

const COULEURS = ['#0d9488', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#f97316']

interface BudgetCategorie {
  name: string
  value: number
}

export default function BudgetPage() {
  const [donnees, setDonnees] = useState<BudgetCategorie[]>([])
  const [parIle, setParIle] = useState<BudgetCategorie[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/paiements-logements').then((r) => r.json()),
      fetch('/api/paiements-autres').then((r) => r.json()),
    ]).then(([logements, autres]) => {
      const totalLog = (logements ?? []).reduce((s: number, r: { total?: number }) => s + (r.total ?? 0), 0)
      const voitures = (autres ?? [])
        .filter((r: { description: string }) => r.description?.toLowerCase().includes('voiture'))
        .reduce((s: number, r: { total?: number }) => s + (r.total ?? 0), 0)
      const activites = (autres ?? [])
        .filter((r: { description: string }) => !r.description?.toLowerCase().includes('voiture') &&
          !r.description?.toLowerCase().includes('ferry') &&
          !r.description?.toLowerCase().includes('esta') &&
          !r.description?.toLowerCase().includes('avion'))
        .reduce((s: number, r: { total?: number }) => s + (r.total ?? 0), 0)
      const ferry = (autres ?? [])
        .filter((r: { description: string }) => r.description?.toLowerCase().includes('ferry'))
        .reduce((s: number, r: { total?: number }) => s + (r.total ?? 0), 0)

      setDonnees([
        { name: 'Logements', value: totalLog },
        { name: 'Vols', value: 7860 },
        { name: 'Voitures', value: voitures },
        { name: 'Activités', value: activites },
        { name: 'Bouffe (est.)', value: 3360 },
        { name: 'Ferry', value: ferry + 50 },
        { name: 'Divers', value: 45 },
      ].filter((d) => d.value > 0))

      setParIle([
        { name: 'Tahiti', value: 11860 },
        { name: 'Moorea', value: 3560 },
        { name: "Taha'a", value: 1771 },
        { name: 'Maupiti', value: 930 },
        { name: 'Bora Bora', value: 3098 },
      ])

      setChargement(false)
    })
  }, [])

  const total = donnees.reduce((s, d) => s + d.value, 0)

  if (chargement) {
    return <div className="flex items-center justify-center h-48 text-gray-400">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📊 Budget</h1>
        <p className="text-gray-500 mt-1">Répartition des dépenses</p>
      </div>

      {/* Total */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total estimé</p>
          <p className="text-3xl font-bold text-gray-800">{euros(21219)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Par personne</p>
          <p className="text-3xl font-bold text-teal-700">{euros(7073)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Durée</p>
          <p className="text-3xl font-bold text-gray-800">28 nuits</p>
          <p className="text-sm text-gray-400">{euros(Math.round(21219 / 28))}/nuit</p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Par catégorie */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Par catégorie</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={donnees} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={false}>
                {donnees.map((_, i) => (
                  <Cell key={i} fill={COULEURS[i % COULEURS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => euros(Number(val))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Par île */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Par île</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={parIle} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={false}>
                {parIle.map((_, i) => (
                  <Cell key={i} fill={COULEURS[i % COULEURS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => euros(Number(val))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableau détaillé */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-800 text-white px-5 py-3">
          <h2 className="font-semibold">Détail par catégorie</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {donnees.map((d, i) => (
            <div key={d.name} className="flex items-center gap-3 px-5 py-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COULEURS[i % COULEURS.length] }} />
              <span className="flex-1 text-gray-800">{d.name}</span>
              <span className="font-semibold text-gray-800">{euros(d.value)}</span>
              <span className="text-xs text-gray-400 w-10 text-right">
                {Math.round((d.value / total) * 100)}%
              </span>
            </div>
          ))}
          <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 font-bold">
            <div className="w-3 h-3 rounded-full flex-shrink-0 bg-gray-800" />
            <span className="flex-1 text-gray-800">Total</span>
            <span className="text-gray-800">{euros(total)}</span>
            <span className="text-xs text-gray-400 w-10 text-right">100%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
