'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function euros(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

interface PaiementLog { id: number; description: string; regis: number | null; isa: number | null; agathe: number | null; total: number | null }
interface PaiementAutre { id: number; description: string; total: number | null }
interface Activite { id: number; ile: string; nom: string; prix: number | null; categorie: string; statut: string | null }

// Catégorisation des entrées de paiements
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
  'Logements':   { emoji: '🏠', couleur: '#0d9488' },
  'Vols':        { emoji: '✈️', couleur: '#0ea5e9' },
  'Voitures':    { emoji: '🚗', couleur: '#f59e0b' },
  'Activités':   { emoji: '🎯', couleur: '#8b5cf6' },
  'Transports':  { emoji: '🚢', couleur: '#06b6d4' },
  'Nourriture':  { emoji: '🍴', couleur: '#f97316' },
  'Divers':      { emoji: '🎲', couleur: '#6b7280' },
}

const NOURRITURE_ESTIME = 3360 // 40€/j estimé depuis l'Excel

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

  if (chargement) return <div className="flex items-center justify-center h-48 text-gray-400">Chargement...</div>

  // Construire les entrées de budget
  const entrees: { description: string; montant: number; categorie: string }[] = []

  // 1. Paiements logements (logements + vols internes)
  for (const p of logements) {
    const montant = p.total ?? ((p.regis ?? 0) + (p.isa ?? 0) + (p.agathe ?? 0))
    if (montant > 0) {
      entrees.push({ description: p.description, montant, categorie: catLog(p.description) })
    }
  }

  // 2. Paiements hors logements (activités payées, voitures, ferry, vols, ESTA)
  for (const p of autres) {
    if (p.total && p.total > 0) {
      entrees.push({ description: p.description, montant: p.total, categorie: catAutre(p.description) })
    }
  }

  // 3. Activités planifiées NON encore payées (statut != 'paye') avec un prix
  //    → on exclut avions, vols internes, voitures (déjà comptés ailleurs)
  //    → les payées sont déjà dans paiements_autres, donc pas de doublon
  const EXCLURE_TRANSPORT = ['vol', 'avion', 'pass inter', 'vt211', 'vt730', 'vt736', 'vt420', 'vt462', 'voiture', 'location', 'avis']

  for (const a of activites) {
    if (!a.prix || a.prix <= 0) continue
    if (a.statut === 'paye') continue // déjà dans paiements_autres

    const nomLower = a.nom.toLowerCase()
    if (EXCLURE_TRANSPORT.some(mot => nomLower.includes(mot))) continue

    const cat = a.categorie === 'bouffe' ? 'Nourriture' : 'Activités'
    entrees.push({
      description: `${a.ile} · ${a.nom}`,
      montant: a.prix,
      categorie: cat
    })
  }

  // 4. Nourriture estimée (base) — réduite si des items bouffe ont été saisis
  const nourritureDejaComptee = entrees.filter(e => e.categorie === 'Nourriture').reduce((s, e) => s + e.montant, 0)
  const nourritureEstimeeRestante = Math.max(0, NOURRITURE_ESTIME - nourritureDejaComptee)
  if (nourritureEstimeeRestante > 0) {
    entrees.push({ description: `Nourriture estimée (reste sur ${euros(NOURRITURE_ESTIME)} total)`, montant: nourritureEstimeeRestante, categorie: 'Nourriture' })
  }

  // Agréger par catégorie
  const parCategorie: Record<string, { montant: number; items: typeof entrees }> = {}
  for (const e of entrees) {
    if (!parCategorie[e.categorie]) parCategorie[e.categorie] = { montant: 0, items: [] }
    parCategorie[e.categorie].montant += e.montant
    parCategorie[e.categorie].items.push(e)
  }

  const total = Object.values(parCategorie).reduce((s, c) => s + c.montant, 0)

  // Données pour les graphiques
  const dataGlobale = Object.entries(parCategorie)
    .map(([name, { montant }]) => ({ name, value: Math.round(montant) }))
    .sort((a, b) => b.value - a.value)

  // Par île (depuis logements)
  const ILE_MAPPING: Record<string, string> = {
    'sunset beach': 'Moorea', 'moorea': 'Moorea',
    'tahaa': "Taha'a", 'tahaa bungalow': "Taha'a", 'bugalow': "Taha'a", 'tiwa': "Taha'a",
    'maupiti': 'Maupiti',
    'bora': 'Bora Bora', 'pilotis': 'Bora Bora', 'matira': 'Bora Bora',
    'tahiti': 'Tahiti',
    'vols': 'Transversal',
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">📊 Budget</h1>
        <p className="text-gray-500 mt-1">Calculé depuis les vrais paiements — sans doublons</p>
      </div>

      {/* Cards résumé */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total estimé</p>
          <p className="text-3xl font-bold text-gray-800">{euros(total)}</p>
          <p className="text-xs text-gray-400 mt-1">dont {euros(NOURRITURE_ESTIME)} nourriture estimée</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Par personne</p>
          <p className="text-3xl font-bold text-teal-700">{euros(Math.round(total / 3))}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Par nuit</p>
          <p className="text-3xl font-bold text-gray-800">{euros(Math.round(total / 28))}</p>
          <p className="text-xs text-gray-400 mt-1">sur 28 nuits</p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Par catégorie</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={dataGlobale} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={false}>
                {dataGlobale.map((entry, i) => (
                  <Cell key={i} fill={CAT_CONFIG[entry.name]?.couleur ?? COULEURS[i % COULEURS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => euros(Number(val))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Logements par île</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={dataIle} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={false}>
                {dataIle.map((_, i) => (
                  <Cell key={i} fill={COULEURS[i % COULEURS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => euros(Number(val))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableau détaillé par catégorie */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-800 text-white px-5 py-3">
          <h2 className="font-semibold">Détail par catégorie</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {Object.entries(parCategorie)
            .sort(([, a], [, b]) => b.montant - a.montant)
            .map(([cat, { montant, items }]) => {
              const conf = CAT_CONFIG[cat]
              return (
                <details key={cat} className="group">
                  <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 list-none">
                    <span className="text-xl">{conf?.emoji ?? '📦'}</span>
                    <span className="flex-1 font-semibold text-gray-800">{cat}</span>
                    <span className="font-bold text-gray-800">{euros(montant)}</span>
                    <span className="text-xs text-gray-400 w-10 text-right">{Math.round((montant / total) * 100)}%</span>
                    <span className="text-gray-400 text-sm group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-5 pb-3 space-y-1 bg-gray-50">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1">
                        <span className="text-gray-600">{item.description}</span>
                        <span className="text-gray-700 font-medium">{euros(item.montant)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )
            })}
          <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 font-bold">
            <span className="text-xl">🌺</span>
            <span className="flex-1 text-gray-800">Total</span>
            <span className="text-gray-800">{euros(total)}</span>
            <span className="text-xs text-gray-400 w-10 text-right">100%</span>
            <span className="w-4"></span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        La nourriture ({euros(NOURRITURE_ESTIME)}) est une estimation (40€/j). Toutes les autres valeurs viennent des paiements saisis.
      </p>
    </div>
  )
}
