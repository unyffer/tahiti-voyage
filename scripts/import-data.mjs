/**
 * Script d'import des données CSV vers Supabase
 * Usage : node scripts/import-data.mjs
 *
 * Prérequis :
 * - Avoir rempli les variables dans .env.local
 * - Avoir créé les tables dans Supabase (voir scripts/schema.sql)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Lire les variables d'environnement manuellement
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '..', '.env.local')
    const content = readFileSync(envPath, 'utf-8')
    content.split('\n').forEach((line) => {
      const [key, ...vals] = line.split('=')
      if (key && !key.startsWith('#')) {
        process.env[key.trim()] = vals.join('=').trim()
      }
    })
  } catch {
    console.error('Impossible de lire .env.local')
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl.includes('REMPLACER')) {
  console.error('❌ Configure d\'abord NEXT_PUBLIC_SUPABASE_URL dans .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Chemin vers les fichiers CSV
const DATA_DIR = resolve(__dirname, '..', 'data')

function readCsv(filename) {
  try {
    return readFileSync(resolve(DATA_DIR, filename), 'utf-8')
  } catch {
    console.warn(`⚠️  Fichier ${filename} non trouvé dans data/ — ignoré`)
    return null
  }
}

function parseCsv(content) {
  if (!content) return []
  const lines = content.split('\n').filter((l) => l.trim())
  return lines.map((line) => {
    const cols = []
    let inQuote = false
    let cell = ''
    for (const char of line) {
      if (char === '"') { inQuote = !inQuote }
      else if (char === ',' && !inQuote) { cols.push(cell.trim()); cell = '' }
      else { cell += char }
    }
    cols.push(cell.trim())
    return cols
  })
}

async function importPlanning() {
  console.log('\n📅 Import du planning (schedule.csv)...')
  const content = readCsv('schedule.csv')
  if (!content) return

  const rows = parseCsv(content).slice(1) // Sauter l'en-tête

  const data = []
  for (const row of rows) {
    if (!row[0] || !row[2]) continue
    const lieu = row[0].trim()
    const nuits = parseInt(row[1]) || null
    const debut = row[2].trim()
    const fin = row[3]?.trim()

    let type = 'sejour'
    if (lieu.toLowerCase().includes('aller')) type = 'aller'
    else if (lieu.toLowerCase().includes('retour')) type = 'retour'

    const notes = [row[4], row[5]].filter(Boolean).join(' · ') || null

    data.push({ lieu, nuits, date_debut: debut, date_fin: fin || debut, type, notes })
  }

  const { error } = await supabase.from('planning').upsert(data, { onConflict: 'lieu,date_debut' })
  if (error) console.error('❌ Erreur planning:', error.message)
  else console.log(`✅ ${data.length} étapes importées`)
}

async function importLogements() {
  console.log('\n🏠 Import des logements (logements.csv)...')
  const content = readCsv('logements.csv')
  if (!content) return

  const rows = parseCsv(content).slice(1) // Sauter l'en-tête

  const data = []
  for (const row of rows) {
    if (!row[0] || row[0].trim() === '') continue

    const raw = row[0].trim() // ex: "Tahiti 04/09 - 07/09"
    const match = raw.match(/^(.+?)\s+(\d{2}\/\d{2})\s*-\s*(\d{2}\/\d{2})/)
    if (!match) continue

    const ile = match[1].trim()
    const periode = `${match[2]} - ${match[3]}`
    const lien_annonce = row[1]?.trim() || null
    const commentaires = row[2]?.trim() || null
    const questions = row[3]?.trim() || null

    data.push({ ile, periode, lien_annonce, commentaires, questions })
  }

  const { error } = await supabase.from('logements').upsert(data, { onConflict: 'ile,periode' })
  if (error) console.error('❌ Erreur logements:', error.message)
  else console.log(`✅ ${data.length} logements importés`)
}

async function importPaiementsLogements() {
  console.log('\n💰 Import des paiements logements (paiements.csv)...')
  const content = readCsv('paiements.csv')
  if (!content) return

  const rows = parseCsv(content).slice(1)

  const data = []
  for (const row of rows) {
    if (!row[0] || row[0].trim() === '') continue
    const desc = row[0].trim()
    // Ignorer les lignes de totalisation
    if (desc.toLowerCase().includes('total') || desc.toLowerCase().includes('credit') ||
        desc.toLowerCase().includes('dû') || desc.toLowerCase().includes('virmt')) continue

    const regis = parseFloat(row[1]?.replace(',', '.')) || null
    const isa = parseFloat(row[2]?.replace(',', '.')) || null
    const agathe = parseFloat(row[3]?.replace(',', '.')) || null
    const total = parseFloat(row[4]?.replace(',', '.')) || null
    const date_echeance = row[5]?.trim() || null
    const reste_a_payer = parseFloat(row[6]?.replace(',', '.')) || null

    data.push({ description: desc, regis, isa, agathe, total, date_echeance, reste_a_payer })
  }

  const { error } = await supabase.from('paiements_logements').upsert(data, { onConflict: 'description' })
  if (error) console.error('❌ Erreur paiements_logements:', error.message)
  else console.log(`✅ ${data.length} paiements logements importés`)
}

async function importPaiementsAutres() {
  console.log('\n💸 Import des paiements hors logements (paiements_hors_logements.csv)...')
  const content = readCsv('paiements_hors_logements.csv')
  if (!content) return

  const rows = parseCsv(content).slice(2) // Sauter 2 lignes d'en-tête

  const data = []
  for (const row of rows) {
    if (!row[0] || row[0].trim() === '') continue
    const desc = row[0].trim()
    if (desc.toLowerCase().includes('total') || desc.toLowerCase().includes('reste')) continue

    const total = parseFloat(row[1]?.replace(',', '.')) || null
    const par_personne = parseFloat(row[2]?.replace(',', '.')) || null
    const reste_par_personne = parseFloat(row[3]?.replace(',', '.')) || null
    const situation = row[4]?.trim() || null

    data.push({ description: desc, total, par_personne, reste_par_personne, situation })
  }

  const { error } = await supabase.from('paiements_autres').upsert(data, { onConflict: 'description' })
  if (error) console.error('❌ Erreur paiements_autres:', error.message)
  else console.log(`✅ ${data.length} paiements hors logements importés`)
}

async function importChecklist() {
  console.log('\n✅ Import de la checklist (a_emporter.csv)...')
  const content = readCsv('a_emporter.csv')
  if (!content) return

  const rows = parseCsv(content)

  const data = []
  // Catégories approximatives basées sur le type d'item
  const categoriesMap = {
    'lampes frontales': 'Mer 🌊',
    'palmes': 'Mer 🌊',
    'masques': 'Mer 🌊',
    't-shirt eau': 'Mer 🌊',
    'shorty': 'Mer 🌊',
    'serviette plage/futa': 'Mer 🌊',
    'lampe camping': 'Rando 🥾',
    'chaussures rando': 'Rando 🥾',
    'chaussures d\'eau': 'Rando 🥾',
    'tshirts/chemise': 'Vêtements 👕',
    'shorts': 'Vêtements 👕',
    'batterie externe': 'Tech 📸',
    'liseuse': 'Tech 📸',
    'go pro + insta360': 'Tech 📸',
    'batteries gopro + insta': 'Tech 📸',
    'dd externe': 'Tech 📸',
    'petis jeux': 'Divers 🎲',
  }

  for (const row of rows) {
    const item = row[0]?.trim()
    if (!item) continue
    const categorie = categoriesMap[item.toLowerCase()] ?? 'Divers 🎲'
    data.push({ item, categorie, checked: false })
  }

  const { error } = await supabase.from('checklist').upsert(data, { onConflict: 'item' })
  if (error) console.error('❌ Erreur checklist:', error.message)
  else console.log(`✅ ${data.length} items importés`)
}

async function seedActivites() {
  console.log('\n🎯 Insertion des activités (données extraites du fichier)...')

  const activites = [
    // Tahiti
    { ile: 'Tahiti', categorie: 'activite', nom: 'Plage PK18', prix: null, gratuit: true, commentaire: null, lien: null, statut: null },
    { ile: 'Tahiti', categorie: 'activite', nom: 'Trou du souffleur', prix: null, gratuit: true, commentaire: null, lien: null, statut: null },
    { ile: 'Tahiti', categorie: 'activite', nom: 'Papeete (visite)', prix: null, gratuit: true, commentaire: null, lien: null, statut: null },
    { ile: 'Tahiti', categorie: 'activite', nom: 'Cascades', prix: null, gratuit: true, commentaire: null, lien: null, statut: null },
    { ile: 'Tahiti', categorie: 'activite', nom: 'Tour de l\'île', prix: null, gratuit: true, commentaire: null, lien: null, statut: null },
    { ile: 'Tahiti', categorie: 'activite', nom: 'Belvédère', prix: null, gratuit: true, commentaire: null, lien: null, statut: null },
    { ile: 'Tahiti', categorie: 'activite', nom: 'Tour bateau Tahiti Iti + Teahupo\'o', prix: 135, gratuit: false, commentaire: '45 €/pers', lien: null, statut: null },
    { ile: 'Tahiti', categorie: 'activite', nom: 'Spectacle de danse', prix: null, gratuit: false, commentaire: 'Intercontinental Tahiti ou Moorea Tiki Village', lien: null, statut: null },
    { ile: 'Tahiti', categorie: 'bouffe', nom: 'Snacks / bouffe', prix: 40, gratuit: false, commentaire: '40 €/j estimé', lien: null, statut: null },
    // Moorea
    { ile: 'Moorea', categorie: 'activite', nom: 'Kayak + requins + raies (Tipaniers)', prix: null, gratuit: false, commentaire: 'À louer à côté, pas de kayak fourni', lien: null, statut: null },
    { ile: 'Moorea', categorie: 'activite', nom: 'Tiki Village spectacle', prix: 300, gratuit: false, commentaire: null, lien: null, statut: null },
    { ile: 'Moorea', categorie: 'activite', nom: 'Tortues + jardin corail', prix: null, gratuit: false, commentaire: null, lien: null, statut: null },
    { ile: 'Moorea', categorie: 'activite', nom: 'Baleines', prix: 600, gratuit: false, commentaire: 'Lagoon vibes le 08/09 à 12h30 · 200€/pers', lien: null, statut: 'paye' },
    { ile: 'Moorea', categorie: 'activite', nom: 'Dauphins', prix: null, gratuit: false, commentaire: null, lien: null, statut: null },
    { ile: 'Moorea', categorie: 'activite', nom: 'Usine Rotui + champs ananas', prix: null, gratuit: true, commentaire: null, lien: null, statut: null },
    { ile: 'Moorea', categorie: 'activite', nom: 'Belvédère Moorea', prix: null, gratuit: true, commentaire: null, lien: null, statut: null },
    { ile: 'Moorea', categorie: 'activite', nom: 'Restau Coco Beach sur Motu', prix: null, gratuit: false, commentaire: null, lien: null, statut: null },
    { ile: 'Moorea', categorie: 'activite', nom: 'Bateau fond transparent', prix: 452, gratuit: false, commentaire: '~150€/pers · déjà payé', lien: null, statut: 'paye' },
    { ile: 'Moorea', categorie: 'bouffe', nom: 'Snack Tipaniers', prix: null, gratuit: false, commentaire: null, lien: null, statut: null },
    { ile: 'Moorea', categorie: 'bouffe', nom: 'Snack Motu', prix: null, gratuit: false, commentaire: null, lien: null, statut: null },
    // Taha'a
    { ile: "Taha'a", categorie: 'activite', nom: 'Snorkeling récif', prix: 0, gratuit: true, commentaire: null, lien: null, statut: null },
    { ile: "Taha'a", categorie: 'activite', nom: 'Jardin de corail — Kayak Founi Maison', prix: null, gratuit: false, commentaire: null, lien: null, statut: null },
    { ile: "Taha'a", categorie: 'activite', nom: 'Havai and Sea excursion', prix: null, gratuit: false, commentaire: null, lien: null, statut: null },
    { ile: "Taha'a", categorie: 'bouffe', nom: 'Motu Tuahi (en excursion)', prix: null, gratuit: false, commentaire: null, lien: null, statut: null },
    // Maupiti
    { ile: 'Maupiti', categorie: 'activite', nom: 'Raies manta', prix: 45, gratuit: false, commentaire: 'Pension Téreia · 45€ raies + jardin corail', lien: 'https://pensiontereia.sitew.fr/Tarifs.B.htm', statut: null },
    { ile: 'Maupiti', categorie: 'activite', nom: 'Jardin corail + raies', prix: 135, gratuit: false, commentaire: null, lien: null, statut: null },
    { ile: 'Maupiti', categorie: 'activite', nom: 'Marche vers Motu', prix: null, gratuit: true, commentaire: null, lien: null, statut: null },
    { ile: 'Maupiti', categorie: 'activite', nom: 'Montée du Pic', prix: null, gratuit: true, commentaire: 'Dangereux sur la fin — à évaluer', lien: null, statut: null },
    // Bora Bora
    { ile: 'Bora Bora', categorie: 'activite', nom: 'Lagoon vibes', prix: null, gratuit: false, commentaire: null, lien: null, statut: null },
    { ile: 'Bora Bora', categorie: 'activite', nom: 'Restau Coco Beach', prix: null, gratuit: false, commentaire: null, lien: null, statut: null },
    { ile: 'Bora Bora', categorie: 'activite', nom: 'Location voiture', prix: 285, gratuit: false, commentaire: 'D\'après le proprio — à réserver', lien: null, statut: null },
  ]

  const { error } = await supabase.from('activites').upsert(activites, { onConflict: 'ile,nom' })
  if (error) console.error('❌ Erreur activites:', error.message)
  else console.log(`✅ ${activites.length} activités insérées`)
}

async function seedVoitures() {
  console.log('\n🚗 Insertion des voitures...')
  const voitures = [
    { ile: 'Bora Bora', periode: '25/09 → 29/09', agence: 'AVIS', statut: 'À confirmer', commentaire: null, prix: 285 },
  ]
  const { error } = await supabase.from('voitures').upsert(voitures, { onConflict: 'ile,periode' })
  if (error) console.error('❌ Erreur voitures:', error.message)
  else console.log(`✅ ${voitures.length} voitures insérées`)
}

// Lancement
console.log('🌺 Import des données Tahiti Voyage → Supabase\n')
console.log('URL Supabase:', supabaseUrl?.substring(0, 30) + '...')

await importPlanning()
await importLogements()
await importPaiementsLogements()
await importPaiementsAutres()
await importChecklist()
await seedActivites()
await seedVoitures()

console.log('\n🎉 Import terminé ! Va sur Supabase pour vérifier tes données.')
