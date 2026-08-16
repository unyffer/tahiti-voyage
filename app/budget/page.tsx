'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function euros(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

interface PaiementLog { id: number; description: string; regis: number | null; isa: number | null; agathe: number | null; total: number | null }
interface PaiementAutre { id: number; description: string; total: number | null }
interface Activite { id: number; ile: string; nom: string; prix: number | null; categorie: string; statut: string | null }

function catLog(description: string): string {
  const d = description.toLowerCase()
  if (d.includes('vol') || d.includes('avion') || d.includes('pass inter')) return 'Vols'
  return 'Logements'
}

function catAutre(description: string): string {
  const d = description.toLowerCase()
  if (d.includes('vol') || d.includes('paris') || d.includes('papeete') || d.includes('pass inter')) return 'Vols'
  if (d.includes('voiture') || d.includes('location') || d.includes('avis')) return 'Voitures'
  if (d.includes('ferry') || d.includes('express') || d.includes('maupiti express')) return 'Transports'
  if (d.includes('esta') || d.includes('taxi')) return 'Divers'
  return 'Activités'
}

const CAT_CONFIG: Record<string, { emoji: string; couleur: string }> = {
  'Logements':  { emoji: '🏠', couleur: '#0284c7' },
  'Vols':       { emoji: '✈️', couleur: '#0ea5e9' },
  'Voitures':   { emoji: '🚗', couleur: '#f59e0b' },
  'Activités':  { emoji: '🎯', couleur: '#8b5cf6' },
  'Transports': { emoji: '🚢', couleur: '#06b6d4' },
  'Nourriture': { emoji: '🍴', couleur: '#f97316' },
  'Divers':     { emoji: '🎲', couleur: '#64748b' },
}

const NOURRITURE_ESTIME = 3360

export default function BudgetPage() {
  const [logements, setLogements] = useState<PaiementLog[]>([])
  const [autres, setAutres] = useState<PaiementAutre[]>([])
  const [activites, setActivites] = useState<Activite[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/paiements-logements').then(r => r.json()),
      fetch('/api/paiements-autres').then(r => r.json()),
      fetch('/api/activites').then(r => r.json()),
    ]).then(([l, a, act]) => {
      setLogements(l ?? [])
      setAutres(a ?? [])
      setActivites(act ?? [])
      setChargement(false)
    })
  }, [])

  if (chargement) return <div className="flex items-center justify-center h-48 text-slate-400">Chargement...</div>

  const entrees: { description: string; montant: number; categorie: string }[] = []
  for (const p of logements) {
    const montant = p.total ?? ((p.regis ?? 0) + (p.isa ?? 0) + (p.agathe ?? 0))
    if (montant > 0) entrees.push({ description: p.description, montant, categorie: catLog(p.description) })
  }
  for (const p of autres) {
    if (p.total && p.total > 0) entrees.push({ description: p.description, montant: p.total, categorie: catAutre(p.description) })
  }
  const EXCLURE = ['vol', 'avion', 'pass inter', 'vt211', 'vt730', 'vt736', 'vt420', 'vt462', 'voiture', 'location', 'avis']
  for (const a of activites) {
    if (!a.prix || a.prix <= 0 || a.statut === 'paye') continue
    const nomLower = a.nom.toLowerCase()
    if (EXCLURE.some(m => nomLower.includes(m))) continue
    const cat = a.categorie === 'bouffe' ? 'Nourriture' : 'Activités'
    entrees.push({ description: `${a.ile} · ${a.nom}`, montant: a.prix, categorie: cat })
  }
  const nourritureDejaComptee = entrees.filter(e => e.categorie === 'Nourriture').reduce((s, e) => s + e.montant, 0)
  const nourritureRestante = Math.max(0, NOURRITURE_ESTIME - nourritureDejaComptee)
  if (nourritureRestante > 0) {
    entrees.push({ description: `Nourriture estimée (reste)`, montant: nourritureRestante, categorie: 'Nourriture' })
  }

  const parCategorie: Record<string, { montant: number; items: typeof entrees }> = {}
  for (const e of entrees) {
    if (!parCategorie[e.categorie]) parCategorie[e.categorie] = { montant: 0, items: [] }
    parCategorie[e.categorie].montant += e.montant
    parCategorie[e.categorie].items.push(e)
  }

  const total = Object.values(parCategorie).reduce((s, c) => s + c.montant, 0)
  const dataGlobale = Object.entries(parCategorie)
    .map(([name, { montant }]) => ({ name, value: Math.round(montant) }))
    .sort((a, b) => b.value - a.value)

  const ILE_MAPPING: Record<string, string> = {
    'sunset beach': 'Moorea', 'moorea': 'Moorea',
    'tahaa': "Taha'a", 'tiwa': "Taha'a",
    'maupiti': 'Maupiti',
    'bora': 'Bora Bora', 'pilotis': 'Bora Bora', 'matira': 'Bora Bora',
    'tahiti': 'Tahiti', 'vols': 'Transversal',
  }
  function getIle(description: string): string {
    const d = description.toLowerCase()
    for (const [key, ile] of Object.entries(ILE_MAPPING)) {
      if (d.includes(key)) return ile
    }
    return 'Autre'
  }
  const parIle: Record<string, number> = {}
  for (const p of logements) {
    const montant = p.total ?? 0
    if (montant > 0) {
      const ile = getIle(p.description)
      parIle[ile] = (parIle[ile] ?? 0) + montant
    }
  }
  const dataIle = Object.entries(parIle)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
  const COULEURS = Object.values(CAT_CONFIG).map(c => c.couleur)

  return (
    <div>
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Budget</h1>
        <p className="text-slate-400 text-sm mt-0.5">Calculé depuis les vrais paiements</p>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-3 gap-3 px-5 mb-5">
        <div className="bg-slate-900 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">Total</p>
          <p className="text-lg font-black text-white">{euros(total)}</p>
        </div>
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 text-center">
          <p className="text-xs text-sky-500 mb-1">/ pers</p>
          <p className="text-lg font-black text-sky-700">{euros(Math.round(total / 3))}</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400 mb-1">/ nuit</p>
          <p className="text-lg font-black text-slate-700">{euros(Math.round(total / 28))}</p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="px-5 mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-bold text-slate-900 mb-3">Par catégorie</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={dataGlobale} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false}>
                {dataGlobale.map((entry, i) => (
                  <Cell key={i} fill={CAT_CONFIG[entry.name]?.couleur ?? COULEURS[i % COULEURS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => euros(Number(val))} />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-bold text-slate-900 mb-3">Logements par île</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={dataIle} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false}>
                {dataIle.map((_, i) => (
                  <Cell key={i} fill={COULEURS[i % COULEURS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => euros(Number(val))} />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableau détaillé */}
      <div className="px-5 mb-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Détail par catégorie</p>
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {Object.entries(parCategorie)
            .sort(([, a], [, b]) => b.montant - a.montant)
            .map(([cat, { montant, items }]) => {
              const conf = CAT_CONFIG[cat]
              return (
                <details key={cat} className="group">
                  <summary className="flex items-center gap-3 px-4 py-3.5 cursor-pointer list-none hover:bg-slate-50">
                    <span className="text-xl flex-shrink-0">{conf?.emoji ?? '📦'}</span>
                    <span className="flex-1 font-semibold text-slate-900 text-sm">{cat}</span>
                    <span className="text-xs text-slate-400 mr-2">{Math.round((montant / total) * 100)}%</span>
                    <span className="font-bold text-slate-900">{euros(montant)}</span>
                    <span className="text-slate-300 text-xs ml-1 group-open:rotate-180 transition-transform inline-block">▼</span>
                  </summary>
                  <div className="px-4 pb-3 bg-slate-50 divide-y divide-slate-100">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-slate-600 flex-1 pr-2 truncate">{item.description}</span>
                        <span className="text-slate-700 font-medium flex-shrink-0">{euros(item.montant)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )
            })}
          <div className="flex items-center gap-3 px-4 py-3.5 bg-slate-50">
            <span className="text-xl">🌺</span>
            <span className="flex-1 font-bold text-slate-900 text-sm">Total</span>
            <span className="font-black text-slate-900">{euros(total)}</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 text-center mt-3">
          Nourriture ({euros(NOURRITURE_ESTIME)}) estimée à 40€/j. Tout le reste provient des paiements saisis.
        </p>
      </div>
    </div>
  )
}
