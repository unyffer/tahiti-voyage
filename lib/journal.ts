// ═══════════════════════════════════════════════
// Journal du voyage — types & utilitaires
// ═══════════════════════════════════════════════

export type Auteur = 'Régis' | 'Isa' | 'Agathe'
export const AUTEURS: Auteur[] = ['Régis', 'Isa', 'Agathe']

export const AUTEUR_AVATAR: Record<Auteur, { bg: string; initiale: string }> = {
  'Régis':  { bg: 'bg-sky-500',     initiale: 'R' },
  'Isa':    { bg: 'bg-pink-500',    initiale: 'I' },
  'Agathe': { bg: 'bg-emerald-500', initiale: 'A' },
}

// ─────────────────────────────────
// Types de données
// ─────────────────────────────────

export interface JournalPhoto {
  id: string
  post_id: string
  storage_path: string
  thumb_path: string | null
  width: number | null
  height: number | null
  sort_order: number
}

export interface JournalComment {
  id: string
  post_id: string
  auteur: Auteur
  texte: string
  created_at: string
}

export interface JournalLike {
  id: string
  post_id: string
  auteur: Auteur
}

export interface JournalPost {
  id: string
  created_at: string
  updated_at: string
  auteur: Auteur
  texte: string | null
  date_voyage: string           // ISO date YYYY-MM-DD
  ile: string | null
  lieu: string | null
  lat: number | null
  lng: number | null
  meteo_temp: number | null
  meteo_code: number | null
  meteo_emoji: string | null
  activite_id: number | null
  sort_order: number
  metadata: Record<string, unknown>
  photos: JournalPhoto[]
  comments: JournalComment[]
  likes: JournalLike[]
}

export interface JournalTrack {
  id: string
  created_at: string
  auteur: Auteur
  lat: number
  lng: number
  ile: string | null
  note: string | null
}

// ─────────────────────────────────
// Météo — Open-Meteo (gratuit, sans API key)
// WMO weather interpretation codes
// ─────────────────────────────────

const WMO_MAP: Record<number, { emoji: string; label: string }> = {
  0:  { emoji: '☀️',  label: 'Ciel dégagé' },
  1:  { emoji: '🌤️', label: 'Peu nuageux' },
  2:  { emoji: '⛅',  label: 'Partiellement nuageux' },
  3:  { emoji: '☁️',  label: 'Couvert' },
  45: { emoji: '🌫️', label: 'Brouillard' },
  48: { emoji: '🌫️', label: 'Brouillard givrant' },
  51: { emoji: '🌦️', label: 'Bruine légère' },
  53: { emoji: '🌦️', label: 'Bruine modérée' },
  55: { emoji: '🌧️', label: 'Bruine dense' },
  61: { emoji: '🌧️', label: 'Pluie légère' },
  63: { emoji: '🌧️', label: 'Pluie modérée' },
  65: { emoji: '🌧️', label: 'Pluie forte' },
  80: { emoji: '🌦️', label: 'Averses légères' },
  81: { emoji: '🌦️', label: 'Averses modérées' },
  82: { emoji: '🌧️', label: 'Averses violentes' },
  95: { emoji: '⛈️',  label: 'Orage' },
  96: { emoji: '⛈️',  label: 'Orage avec grêle' },
  99: { emoji: '⛈️',  label: 'Orage violent' },
}

export function wmoToEmoji(code: number | null): string {
  if (code == null) return '🌡️'
  // Trouver la clé la plus proche (les codes WMO ne sont pas toujours 1:1)
  return WMO_MAP[code]?.emoji ?? WMO_MAP[Math.floor(code / 10) * 10]?.emoji ?? '🌡️'
}

// Coordonnées centre des îles de Polynésie
export const ILE_COORDS: Record<string, { lat: number; lng: number }> = {
  'tahiti':    { lat: -17.5317, lng: -149.5611 },
  'moorea':    { lat: -17.5397, lng: -149.8320 },
  'tahaa':     { lat: -16.6200, lng: -151.5000 },
  'maupiti':   { lat: -16.4500, lng: -152.2500 },
  'bora-bora': { lat: -16.4987, lng: -151.7315 },
}

export interface MeteoData {
  temp: number
  code: number
  emoji: string
  label: string
}

export async function fetchMeteo(lat: number, lng: number): Promise<MeteoData | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
      `&current=temperature_2m,weather_code` +
      `&timezone=Pacific%2FTahiti`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = await res.json()
    const code: number = data.current.weather_code
    const temp: number = Math.round(data.current.temperature_2m)
    return {
      temp,
      code,
      emoji: wmoToEmoji(code),
      label: WMO_MAP[code]?.label ?? `Code ${code}`,
    }
  } catch {
    return null
  }
}

// ─────────────────────────────────
// Géolocalisation navigateur
// ─────────────────────────────────

export interface GeoPos { lat: number; lng: number }

export function getCurrentPosition(): Promise<GeoPos> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Géolocalisation non disponible'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 10_000, maximumAge: 60_000, enableHighAccuracy: true }
    )
  })
}

// ─────────────────────────────────
// Compression d'image côté navigateur (Canvas API)
// Zéro dépendance — fonctionne avec WebP natif mobile
// ─────────────────────────────────

export async function compressImage(
  file: File,
  maxPx: number,
  quality: number
): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let w = img.naturalWidth
      let h = img.naturalHeight
      // Réduire si plus grand que maxPx
      if (w > maxPx || h > maxPx) {
        if (w >= h) { h = Math.round((h * maxPx) / w); w = maxPx }
        else        { w = Math.round((w * maxPx) / h); h = maxPx }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas non disponible')); return }
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      // WebP si supporté, fallback JPEG
      canvas.toBlob(
        (blob) => {
          if (blob) resolve({ blob, width: w, height: h })
          else reject(new Error('Échec compression'))
        },
        'image/webp',
        quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image illisible')) }
    img.src = url
  })
}

// ─────────────────────────────────
// URL publique Supabase Storage
// ─────────────────────────────────

export function getPhotoUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/journal/${storagePath}`
}

// ─────────────────────────────────
// Identité locale (localStorage)
// ─────────────────────────────────

const LS_KEY = 'tahiti_auteur'

export function getAuteurLocal(): Auteur | null {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(LS_KEY)
  return AUTEURS.includes(v as Auteur) ? (v as Auteur) : null
}

export function setAuteurLocal(a: Auteur) {
  localStorage.setItem(LS_KEY, a)
}

// ─────────────────────────────────
// Helpers affichage
// ─────────────────────────────────

export function formatDateVoyage(d: string): string {
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long'
    })
  } catch {
    return d
  }
}

export function formatHeure(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

// Numéro du jour de voyage (4 sept = Jour 1)
const DEPART = new Date('2026-09-04')
export function jourDuVoyage(dateVoyage: string): number {
  try {
    const d = new Date(dateVoyage + 'T12:00:00')
    return Math.floor((d.getTime() - DEPART.getTime()) / 86_400_000) + 1
  } catch {
    return 0
  }
}
