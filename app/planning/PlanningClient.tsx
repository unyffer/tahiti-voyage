'use client'

import { useState, useMemo } from 'react'
import { ILES } from '@/lib/constants'
import Link from 'next/link'

interface PlanningRow {
  id: number
  lieu: string
  nuits: number | null
  date_debut: string
  date_fin: string
  type: string
  notes: string | null
  sort_order: number | null
}

// Hex values matching the Tailwind couleur classes defined in lib/constants.ts
const ILE_HEX: Record<string, string> = {
  'tahiti':     '#10b981', // emerald-500
  'moorea':     '#14b8a6', // teal-500
  "taha'a":     '#ec4899', // pink-500
  'taha':       '#ec4899',
  'raiatea':    '#ec4899',
  'maupiti':    '#3b82f6', // blue-500
  'bora bora':  '#06b6d4', // cyan-500
  'bora-bora':  '#06b6d4',
}

const ILE_EMOJIS: Record<string, string> = {
  'tahiti':    '🌺',
  'moorea':    '🐋',
  "taha'a":    '🌸',
  'taha':      '🌸',
  'raiatea':   '🌸',
  'maupiti':   '🤿',
  'bora bora': '🏝️',
  'bora-bora': '🏝️',
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  } catch { return d }
}

function getSlug(lieu: string) {
  return lieu.toLowerCase().replace(/ /g, '-')
}

// Partial match: "Taha'a & Raiatea" → finds 'taha'a' key
function getHex(lieu: string): string | null {
  const lower = lieu.toLowerCase()
  if (ILE_HEX[lower]) return ILE_HEX[lower]
  for (const [key, hex] of Object.entries(ILE_HEX)) {
    if (lower.includes(key)) return hex
  }
  return null
}

function getEmoji(lieu: string): string {
  const lower = lieu.toLowerCase()
  if (ILE_EMOJIS[lower]) return ILE_EMOJIS[lower]
  for (const [key, emoji] of Object.entries(ILE_EMOJIS)) {
    if (lower.includes(key)) return emoji
  }
  return '📍'
}

// Local-time ISO date string (avoids UTC offset issues)
function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// For séjours: color from date_debut (inclusive) to date_fin (exclusive — it's checkout day).
// For aller/retour flights: exact day match on date_debut.
function getEtapeForDay(dateStr: string, planning: PlanningRow[]): PlanningRow | null {
  const sejour = planning.find(
    e => e.type === 'sejour' && e.date_debut <= dateStr && dateStr < e.date_fin
  )
  if (sejour) return sejour
  return planning.find(e => e.type !== 'sejour' && e.date_debut === dateStr) ?? null
}

interface CalendarDay {
  date: Date
  dateStr: string
  inTrip: boolean
  etape: PlanningRow | null
}

function buildCalendarWeeks(planning: PlanningRow[]): CalendarDay[][] {
  // Local-time dates to avoid DST/UTC shifting
  const tripStart = new Date(2026, 8, 4)  // Sept 4
  const tripEnd   = new Date(2026, 9, 2)  // Oct 2

  // Monday of the week containing tripStart (Sept 4, 2026 = Friday → back to Aug 31)
  const calStart = new Date(tripStart)
  const dow = calStart.getDay() // 0=Sun
  calStart.setDate(calStart.getDate() - (dow === 0 ? 6 : dow - 1))

  // Sunday of the week containing tripEnd
  const calEnd = new Date(tripEnd)
  const dowEnd = calEnd.getDay()
  calEnd.setDate(calEnd.getDate() + (dowEnd === 0 ? 0 : 7 - dowEnd))

  const weeks: CalendarDay[][] = []
  const cur = new Date(calStart)

  while (cur <= calEnd) {
    const week: CalendarDay[] = []
    for (let i = 0; i < 7; i++) {
      const dateStr = toDateStr(cur)
      const inTrip = cur >= tripStart && cur <= tripEnd
      week.push({
        date: new Date(cur),
        dateStr,
        inTrip,
        etape: inTrip ? getEtapeForDay(dateStr, planning) : null,
      })
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
  }

  return weeks
}

export default function PlanningClient({ planning }: { planning: PlanningRow[] }) {
  const [vue, setVue] = useState<'timeline' | 'calendrier'>('timeline')
  const weeks = useMemo(() => buildCalendarWeeks(planning), [planning])
  const todayStr = toDateStr(new Date())

  return (
    <div className="space-y-6">

      {/* Header + toggle */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📅 Planning détaillé</h1>
          <p className="text-gray-500 mt-1">4 septembre → 2 octobre 2026 · 28 nuits</p>
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
          <button
            onClick={() => setVue('timeline')}
            className={`px-4 py-2 transition-colors ${
              vue === 'timeline'
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            📋 Timeline
          </button>
          <button
            onClick={() => setVue('calendrier')}
            className={`px-4 py-2 transition-colors border-l border-gray-200 ${
              vue === 'calendrier'
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            🗓️ Calendrier
          </button>
        </div>
      </div>

      {/* ─── TIMELINE VIEW ─── */}
      {vue === 'timeline' && (
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-teal-200" />
          <div className="space-y-4">
            {planning.map((etape) => {
              const isVoyage = etape.type !== 'sejour'
              const lienIle = !isVoyage ? `/iles/${getSlug(etape.lieu)}` : null
              const hex = !isVoyage ? null : getHex(etape.lieu)

              return (
                <div key={etape.id} className="relative flex gap-4">
                  <div
                    className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-sm border-2 bg-white`}
                    style={{
                      borderColor: isVoyage ? '#d1d5db' : (hex ?? '#5eead4'),
                      backgroundColor: isVoyage ? '#f9fafb' : '#ffffff',
                    }}
                  >
                    {isVoyage ? '✈️' : getEmoji(etape.lieu)}
                  </div>

                  <div
                    className={`flex-1 rounded-xl p-4 shadow-sm border ${
                      isVoyage ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        {lienIle ? (
                          <Link href={lienIle} className="text-lg font-bold hover:opacity-80 transition-opacity"
                            style={{ color: hex ?? '#0f766e' }}>
                            {etape.lieu}
                          </Link>
                        ) : (
                          <h3 className="text-lg font-bold text-gray-600">{etape.lieu}</h3>
                        )}
                        <p className="text-sm text-gray-500">
                          {formatDate(etape.date_debut)} → {formatDate(etape.date_fin)}
                          {etape.nuits ? ` · ${etape.nuits} nuit${etape.nuits > 1 ? 's' : ''}` : ''}
                        </p>
                      </div>
                      {etape.nuits && (
                        <span
                          className="text-white text-xs font-semibold px-2 py-1 rounded-full"
                          style={{ backgroundColor: hex ?? '#6b7280' }}
                        >
                          {etape.nuits} nuits
                        </span>
                      )}
                    </div>

                    {etape.notes && (
                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-2">{etape.notes}</p>
                    )}
                    {lienIle && (
                      <Link
                        href={lienIle}
                        className="text-sm font-medium mt-2 inline-block hover:opacity-80 transition-opacity"
                        style={{ color: hex ?? '#0f766e' }}
                      >
                        Voir la page {etape.lieu} →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── CALENDAR VIEW ─── */}
      {vue === 'calendrier' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(j => (
                <div key={j} className="text-center py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {j}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-gray-100 last:border-0">
                {week.map(({ date, dateStr, inTrip, etape }) => {
                  const isVol = etape?.type !== 'sejour'
                  const hex = etape && !isVol ? getHex(etape.lieu) : null
                  const isToday = dateStr === todayStr
                  const slug = etape && !isVol ? getSlug(etape.lieu) : null

                  return (
                    <div
                      key={dateStr}
                      className={`relative min-h-[76px] p-1.5 border-r border-gray-100 last:border-0 flex flex-col ${
                        !inTrip ? 'bg-gray-50/60' : ''
                      }`}
                      style={hex ? { backgroundColor: `${hex}18` } : undefined}
                    >
                      {/* Day number */}
                      <span
                        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-0.5 ${
                          isToday
                            ? 'bg-teal-600 text-white'
                            : inTrip
                            ? 'text-gray-700'
                            : 'text-gray-300'
                        }`}
                      >
                        {date.getDate()}
                      </span>

                      {/* Month label on the 1st */}
                      {date.getDate() === 1 && (
                        <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wide -mt-0.5 mb-0.5">
                          {date.toLocaleDateString('fr-FR', { month: 'short' })}
                        </span>
                      )}

                      {/* Content */}
                      {etape && (
                        <div className="flex-1 flex flex-col">
                          {isVol ? (
                            <span className="text-sm leading-none mt-0.5">✈️</span>
                          ) : hex && slug ? (
                            <Link
                              href={`/iles/${slug}`}
                              className="text-[10px] font-semibold leading-tight truncate rounded px-1 py-0.5 text-white hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: hex }}
                            >
                              {getEmoji(etape.lieu)} {etape.lieu}
                            </Link>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Légende</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2.5">
              {ILES.map(ile => {
                const hex = getHex(ile.nom) ?? '#9ca3af'
                return (
                  <div key={ile.slug} className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded flex-shrink-0" style={{ backgroundColor: hex }} />
                    <span className="text-sm text-gray-700">{ile.emoji} {ile.nom}</span>
                  </div>
                )
              })}
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded flex-shrink-0 bg-gray-300" />
                <span className="text-sm text-gray-700">✈️ Vol</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
