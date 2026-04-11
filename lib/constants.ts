export const ILES = [
  { slug: 'tahiti', nom: 'Tahiti', emoji: '🌺', couleur: 'bg-emerald-500' },
  { slug: 'moorea', nom: 'Moorea', emoji: '🐋', couleur: 'bg-teal-500' },
  { slug: 'tahaa', nom: "Taha'a", emoji: '🌸', couleur: 'bg-pink-500' },
  { slug: 'maupiti', nom: 'Maupiti', emoji: '🤿', couleur: 'bg-blue-500' },
  { slug: 'bora-bora', nom: 'Bora Bora', emoji: '🏝️', couleur: 'bg-cyan-500' },
]

export const ILE_LABELS: Record<string, string> = {
  tahiti: 'Tahiti',
  moorea: 'Moorea',
  tahaa: "Taha'a",
  maupiti: 'Maupiti',
  'bora-bora': 'Bora Bora',
  'bora bora': 'Bora Bora',
}

export const PERSONNES = ['Régis', 'Isa', 'Agathe'] as const
export type Personne = typeof PERSONNES[number]

export const VOYAGE_DATES = {
  debut: '04/09/2026',
  fin: '02/10/2026',
  total_nuits: 28,
}

export const BUDGET_TOTAL = 21219
export const BUDGET_PAR_PERSONNE = 7073
