'use client'

import { useState, useMemo } from 'react'
import { ILES } from '@/lib/constants'
import Link from 'next/link'

interface PlanningRow {
  id: number; lieu: string; nuits: number | null; date_debut: string; date_fin: string
  type: string; notes: string | null; sort_order: number | null
}

const ILE_HEX: Record<string, string> = {
  'tahiti':    '#10b981',
  'moorea':    '#14b8a6',
  "taha'a":    '#ec4899',
  'taha':      '#ec4899',
  'raiatea':   '#ec4899',
  'maupiti':   '#3b82f6',
  'bora bora': '#06b6d4',
  'bora-bora': '#06b6d4',
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
  try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) }
  catch { return d }
}

function getSlug(lieu: string) { return lieu.toLowerCase().replace(/ /g, '-') }

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

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getEtapeForDay(dateStr: string, planning: PlanningRow[]): PlanningRow | null {
  const sejour = planning.find(e => e.type === 'sejour' && e.date_debut <= dateStr && dateStr < e.date_fin)
  if (sejour) return sejour
  return planning.find(e => e.type !== 'sejour' && e.date_debut === dateStr) ?? null
}

interface CalendarDay { date: Date; dateStr: string; inTrip: boolean; etape: PlanningRow | null }

function buildCalendarWeeks(planning: PlanningRow[]): CalendarDay[][] {
  const tripStart = new Date(2026, 8, 4)
  const tripEnd   = new Date(2026, 9, 2)
  const calStart = new Date(tripStart)
  const dow = calStart.getDay()
  calStart.setDate(calStart.getDate() - (dow === 0 ? 6 : dow - 1))
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
      week.push({ date: new Date(cur), dateStr, inTrip, etape: inTrip ? getEtapeForDay(dateStr, planning) : null })
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
    <div>
      <div className="px-5 pt-8 pb-4 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Planning</h1>
          <p className="text-slate-400 text-sm mt-0.5">4 sept → 2 oct · 28 nuits</p>
        </div>
        {/* Toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {[{ id: 'timeline', label: '📋' }, { id: 'calendrier', label: '📅' }].map(({ id, label }) => (
            <button key={id}
              onClick={() => setVue(id as 'timeline' | 'calendrier')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                vue === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TIMELINE ── */}
      {vue === 'timeline' && (
        <div className="px-5 pb-4">
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-100" />
            <div className="space-y-3">
              {planning.map((etape) => {
                const isVol = etape.type !== 'sejour'
                const hex = getHex(etape.lieu)
                const slug = !isVol ? getSlug(etape.lieu) : null

                return (
                  <div key={etape.id} className="relative flex gap-4 pl-4">
                    {/* Dot */}
                    <div
                      className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 bg-white shadow-sm"
                      style={{ borderColor: isVol ? '#e2e8f0' : (hex ?? '#0ea5e9') }}
                    >
                      {isVol ? '✈️' : getEmoji(etape.lieu)}
                    </div>

                    {/* Card */}
                    <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm mb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {slug ? (
                            <Link href={`/iles/${slug}`}
                              className="font-bold text-base hover:opacity-80 transition-opacity"
                              style={{ color: hex ?? '#0f172a' }}>
                              {etape.lieu}
                            </Link>
                          ) : (
                            <p className="font-bold text-base text-slate-500">{etape.lieu}</p>
                          )}
                          <p className="text-sm text-slate-400 mt-0.5">
                            {formatDate(etape.date_debut)} → {formatDate(etape.date_fin)}
                            {etape.nuits ? ` · ${etape.nuits}n` : ''}
                          </p>
                        </div>
                        {etape.nuits && hex && (
                          <span className="flex-shrink-0 text-white text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: hex }}>
                            {etape.nuits}n
                          </span>
                        )}
                      </div>

                      {etape.notes && (
                        <p className="text-sm text-slate-500 mt-2 bg-slate-50 rounded-xl p-2.5">{etape.notes}</p>
                      )}
                      {slug && (
                        <Link href={`/iles/${slug}`}
                          className="text-xs font-semibold mt-2 inline-block hover:opacity-70 transition-opacity"
                          style={{ color: hex ?? '#0f172a' }}>
                          Voir {etape.lieu} →
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── CALENDRIER ── */}
      {vue === 'calendrier' && (
        <div className="px-5 pb-4 space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((j, i) => (
                <div key={i} className="text-center py-2 text-xs font-bold text-slate-400 uppercase">{j}</div>
              ))}
            </div>

            {/* Semaines */}
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-slate-100 last:border-0">
                {week.map(({ date, dateStr, inTrip, etape }) => {
                  const isVol = etape?.type !== 'sejour'
                  const hex = etape && !isVol ? getHex(etape.lieu) : null
                  const isToday = dateStr === todayStr
                  const slug = etape && !isVol ? getSlug(etape.lieu) : null

                  return (
                    <div key={dateStr}
                      className={`relative min-h-[68px] p-1 border-r border-slate-100 last:border-0 flex flex-col ${
                        !inTrip ? 'bg-slate-50/50' : ''
                      }`}
                      style={hex ? { backgroundColor: `${hex}15` } : undefined}
                    >
                      <span className={`text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full mb-0.5 ${
                        isToday ? 'bg-sky-600 text-white' : inTrip ? 'text-slate-700' : 'text-slate-300'
                      }`}>
                        {date.getDate()}
                      </span>
                      {date.getDate() === 1 && (
                        <span className="text-[8px] font-bold text-slate-400 uppercase -mt-0.5 mb-0.5">
                          {date.toLocaleDateString('fr-FR', { month: 'short' })}
                        </span>
                      )}
                      {etape && (
                        <div className="flex-1 flex flex-col">
                          {isVol ? (
                            <span className="text-xs">✈️</span>
                          ) : hex && slug ? (
                            <Link href={`/iles/${slug}`}
                              className="text-[9px] font-bold leading-tight truncate rounded-lg px-1 py-0.5 text-white hover:opacity-90"
                              style={{ backgroundColor: hex }}>
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

          {/* Légende */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Légende</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {ILES.map(ile => {
                const hex = getHex(ile.nom) ?? '#9ca3af'
                return (
                  <Link key={ile.slug} href={`/iles/${ile.slug}`}
                    className="flex items-center gap-1.5 hover:opacity-80">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: hex }} />
                    <span className="text-xs text-slate-600">{ile.emoji} {ile.nom}</span>
                  </Link>
                )
              })}
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm flex-shrink-0 bg-slate-300" />
                <span className="text-xs text-slate-600">✈️ Vol</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
