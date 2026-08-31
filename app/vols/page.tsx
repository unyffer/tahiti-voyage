'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { RefreshCw, Plane } from 'lucide-react'
import FlightStatusBadge from '@/components/FlightStatusBadge'
import type { VolStatusResponse } from '@/app/api/vols-status/route'

// ─── Données statiques des 5 vols Air Tahiti ────────────────────────────────

interface VolInfo {
  vol: string
  de: string; deCode: string
  vers: string; versCode: string
  date: string       // ISO YYYY-MM-DD (heure locale Polynésie)
  dateLabel: string  // "lun. 14 sept."
  depart: string     // HH:MM prévu
  arrivee: string    // HH:MM prévu
  duree: string      // "45 min"
}

const VOLS: VolInfo[] = [
  {
    vol: 'VT211', de: 'Moorea', deCode: 'MOZ', vers: 'Raiatea', versCode: 'RFP',
    date: '2026-09-14', dateLabel: 'lun. 14 sept.',
    depart: '10:50', arrivee: '11:35', duree: '45 min',
  },
  {
    vol: 'VT730', de: 'Raiatea', deCode: 'RFP', vers: 'Maupiti', versCode: 'MAU',
    date: '2026-09-19', dateLabel: 'sam. 19 sept.',
    depart: '13:30', arrivee: '13:55', duree: '25 min',
  },
  {
    vol: 'VT736', de: 'Maupiti', deCode: 'MAU', vers: 'Raiatea', versCode: 'RFP',
    date: '2026-09-22', dateLabel: 'mar. 22 sept.',
    depart: '09:20', arrivee: '09:45', duree: '25 min',
  },
  {
    vol: 'VT420', de: 'Raiatea', deCode: 'RFP', vers: 'Bora Bora', versCode: 'BOB',
    date: '2026-09-22', dateLabel: 'mar. 22 sept.',
    depart: '18:30', arrivee: '18:50', duree: '20 min',
  },
  {
    vol: 'VT462', de: 'Bora Bora', deCode: 'BOB', vers: 'Tahiti (Faaa)', versCode: 'PPT',
    date: '2026-09-29', dateLabel: 'mar. 29 sept.',
    depart: '08:00', arrivee: '08:50', duree: '50 min',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Retourne la date locale en Polynésie (UTC-10) sous forme YYYY-MM-DD */
function todayInPolynesia(): string {
  const now = new Date()
  // UTC-10 : soustraire 10h
  const poly = new Date(now.getTime() - 10 * 60 * 60 * 1000)
  return poly.toISOString().slice(0, 10)
}

type VolPhase = 'futur' | 'live' | 'passe'

function getPhase(dateISO: string, today: string): VolPhase {
  if (dateISO < today) return 'passe'
  // Tous les vols futurs (même à J+15) reçoivent le statut live
  // pour détecter les changements d'horaires à l'avance
  return 'live'
}

function timeAgo(isoStr: string): string {
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000)
  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  return `il y a ${Math.floor(diff / 3600)}h`
}

// ─── Composant carte vol ──────────────────────────────────────────────────────

interface FlightCardProps {
  vol: VolInfo
  phase: VolPhase
  status: VolStatusResponse | null
  loading: boolean
  today: string
  onRefresh: () => void
}

function FlightCard({ vol, phase, status, loading, today, onRefresh }: FlightCardProps) {
  const departAffiche = status?.source === 'live' && status.departPrévu ? status.departPrévu : vol.depart
  const arriveeAffiche = status?.source === 'live' && status.arriveePrévue ? status.arriveePrévue : vol.arrivee
  const isRetarde = status?.retard && status.retard > 0
  const isLive = phase === 'live'
  const isPasse = phase === 'passe'

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
      isPasse ? 'border-slate-100 opacity-70' : 'border-slate-100'
    }`}>
      {/* En-tête */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        isPasse ? 'bg-slate-50' : 'bg-indigo-700'
      }`}>
        <div className="flex items-center gap-2.5">
          <span className={`font-black text-sm px-2.5 py-1 rounded-lg ${
            isPasse
              ? 'bg-slate-200 text-slate-500'
              : 'bg-white/20 text-white'
          }`}>
            {vol.vol}
          </span>
          <span className={`text-sm font-semibold ${isPasse ? 'text-slate-500' : 'text-indigo-100'}`}>
            {vol.dateLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isLive && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className={`p-1.5 rounded-lg transition-all ${
                loading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-white/20 active:scale-95'
              }`}
              title="Rafraîchir le statut"
            >
              <RefreshCw
                size={14}
                className={`${isPasse ? 'text-slate-400' : 'text-white'} ${loading ? 'animate-spin' : ''}`}
              />
            </button>
          )}
          {isPasse && (
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              Effectué
            </span>
          )}
        </div>
      </div>

      {/* Corps */}
      <div className="px-4 py-4">
        {/* Route */}
        <div className="flex items-center gap-3 mb-4">
          {/* Départ */}
          <div className="flex-1 text-center">
            <p className="text-2xl font-black text-slate-900">{vol.deCode}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-tight">{vol.de}</p>
          </div>

          {/* Flèche + durée */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center w-full gap-1">
              <div className="h-px flex-1 bg-slate-200" />
              <Plane size={14} className={`flex-shrink-0 ${isPasse ? 'text-slate-300' : 'text-indigo-400'}`} />
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <p className="text-[10px] text-slate-400 font-medium">{vol.duree}</p>
          </div>

          {/* Arrivée */}
          <div className="flex-1 text-center">
            <p className="text-2xl font-black text-slate-900">{vol.versCode}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-tight">{vol.vers}</p>
          </div>
        </div>

        {/* Horaires */}
        <div className="flex items-start justify-between">
          {/* Départ */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Départ</p>
            <p className="text-xl font-black text-slate-900">{departAffiche}</p>
            {isRetarde && status?.departRéel && (
              <p className="text-xs text-orange-500 font-semibold mt-0.5">
                Réel : {status.departRéel}
              </p>
            )}
          </div>

          {/* Badge statut */}
          {isPasse && (
            <div className="flex flex-col items-center gap-1 mt-1">
              <FlightStatusBadge statut="Landed" source="live" />
            </div>
          )}
          {isLive && (
            <div className="flex flex-col items-center gap-1 mt-1">
              {loading ? (
                <span className="text-[11px] text-slate-400 animate-pulse">Chargement…</span>
              ) : status ? (
                <FlightStatusBadge
                  statut={status.statut}
                  retard={status.retard}
                  source={status.source}
                />
              ) : null}
            </div>
          )}

          {/* Arrivée */}
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Arrivée</p>
            <p className="text-xl font-black text-slate-900">{arriveeAffiche}</p>
            {isRetarde && status?.arriveeRéelle && (
              <p className="text-xs text-orange-500 font-semibold mt-0.5">
                Réel : {status.arriveeRéelle}
              </p>
            )}
          </div>
        </div>

        {/* Pied : dernière mise à jour */}
        {isLive && status && !loading && (
          <p className="text-[10px] text-slate-300 mt-3 text-center">
            {status.source !== 'live'
              ? 'Statut live non disponible · Vérifiez sur airtahiti.pf'
              : phase === 'live' && vol.date === today
                ? `Mis à jour ${timeAgo(status.fetchedAt)}`
                : `Horaires confirmés au ${timeAgo(status.fetchedAt)}`}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function VolsPage() {
  const today = todayInPolynesia()
  const [statuses, setStatuses] = useState<Record<string, VolStatusResponse | null>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const fetchedRef = useRef<Record<string, boolean>>({})

  const fetchStatus = useCallback(async (vol: VolInfo) => {
    const key = vol.vol
    setLoading(prev => ({ ...prev, [key]: true }))
    try {
      const res = await fetch(`/api/vols-status?vol=${vol.vol}&date=${vol.date}`)
      if (res.ok) {
        const data: VolStatusResponse = await res.json()
        setStatuses(prev => ({ ...prev, [key]: data }))
      }
    } catch {
      // Silently fail — card shows "non disponible"
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }))
    }
  }, [])

  // Au chargement : fetcher le statut de tous les vols non passés
  useEffect(() => {
    const volsAVenir = VOLS.filter(v => v.date >= today)
    for (const v of volsAVenir) {
      if (!fetchedRef.current[v.vol]) {
        fetchedRef.current[v.vol] = true
        fetchStatus(v)
      }
    }
  }, [today, fetchStatus])

  // Auto-refresh toutes les 5 minutes — uniquement les vols du jour (utile en temps réel)
  useEffect(() => {
    const volsDuJour = VOLS.filter(v => v.date === today)
    if (volsDuJour.length === 0) return

    const interval = setInterval(() => {
      for (const v of volsDuJour) {
        fetchStatus(v)
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [today, fetchStatus])

  const liveCount = VOLS.filter(v => v.date === today).length

  return (
    <div className="pb-6">
      {/* En-tête */}
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Vols Air Tahiti</h1>
        <p className="text-slate-400 text-sm mt-0.5">Pass inter-îles · 5 vols · Haute saison</p>
      </div>

      {/* Résumé du pass */}
      <div className="mx-5 mb-5 bg-indigo-700 rounded-2xl px-4 py-3.5 flex items-center justify-between">
        <div>
          <p className="text-indigo-200 text-xs font-semibold">Pass inter-îles · 3 pers.</p>
          <p className="text-white font-black text-xl">1 755 €</p>
          <p className="text-indigo-300 text-xs mt-0.5">585 € / personne · ✅ Payé</p>
        </div>
        <div className="text-right">
          <p className="text-indigo-200 text-xs">Escale Raiatea</p>
          <p className="text-indigo-100 text-xs mt-0.5">Maupiti ↔ Bora Bora</p>
          {liveCount > 0 && (
            <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-emerald-400/20 text-emerald-200 text-[10px] font-bold rounded-full border border-emerald-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
      </div>

      {/* Avertissement météo Maupiti */}
      <div className="mx-5 mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2.5">
        <span className="text-lg flex-shrink-0">⚠️</span>
        <p className="text-xs text-amber-800 leading-relaxed">
          <span className="font-bold">Maupiti :</span> les vols peuvent être annulés sans préavis en cas de météo défavorable.
          Vérifiez toujours le statut le jour J sur{' '}
          <a href="https://www.airtahiti.pf" target="_blank" rel="noopener noreferrer"
            className="underline font-semibold">airtahiti.pf</a>.
        </p>
      </div>

      {/* Cartes de vol */}
      <div className="px-5 space-y-4">
        {VOLS.map(vol => {
          const phase = getPhase(vol.date, today)
          return (
            <FlightCard
              key={vol.vol}
              vol={vol}
              phase={phase}
              status={statuses[vol.vol] ?? null}
              loading={loading[vol.vol] ?? false}
              today={today}
              onRefresh={() => fetchStatus(vol)}
            />
          )
        })}
      </div>

      {/* Note bas de page */}
      <p className="text-center text-[11px] text-slate-300 mt-6 px-5">
        Statut live fourni par AeroDataBox · Rafraîchi toutes les 5 min
      </p>
    </div>
  )
}
