export interface PlanningRow {
  id: number
  lieu: string
  nuits: number | null
  date_debut: string
  date_fin: string
  type: 'aller' | 'sejour' | 'retour'
  notes: string | null
}

export interface LogementRow {
  id: number
  ile: string
  periode: string
  lien_annonce: string | null
  commentaires: string | null
  questions: string | null
}

export interface PaiementLogementRow {
  id: number
  description: string
  regis: number | null
  isa: number | null
  agathe: number | null
  total: number | null
  date_echeance: string | null
  reste_a_payer: number | null
  lien_reservation: string | null
}

export interface PaiementAutreRow {
  id: number
  description: string
  total: number | null
  par_personne: number | null
  reste_par_personne: number | null
  situation: string | null
}

export interface ActiviteRow {
  id: number
  ile: string
  categorie: 'activite' | 'nourriture' | 'transport'
  nom: string
  prix: number | null
  lien: string | null
  liens: string[]
  commentaire: string | null
  gratuit: boolean
  statut: 'a_faire' | 'reserve' | 'paye' | null
}

export interface ChecklistRow {
  id: number
  item: string
  categorie: string
  checked: boolean
}

export interface VoitureRow {
  id: number
  ile: string
  periode: string | null
  agence: string | null
  statut: string | null
  commentaire: string | null
  prix: number | null
}
