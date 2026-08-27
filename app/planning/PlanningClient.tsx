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

interface ActiviteCalendar {
  id: number; nom: string; categorie: string; statut: string | null
  date_heure: string | null; lieu: string | null
}

interface CalendarDay { date: Date; dateStr: string; inTrip: boolean; etape: PlanningRow | null }

/** Emoji représentatif selon la catégorie et le nom de l'activité */
function getActiviteEmoji(a: ActiviteCalendar): string {
  const nom = (a.nom ?? '').toLowerCase()
  if (a.categorie === 'transport') {
    if (nom.startsWith('vt') || nom.includes(' vol ') || nom.includes('faaa') || nom.includes('papeete')) return '✈️'
    if (nom.includes('ferry') || nom.includes('express') || nom.includes('bateau')) return '🚢'
    return '✈️'
  }
  if (a.categorie === 'bouffe') {
    if (nom.includes('snack') || nom.includes('restau') || nom.includes('coco')) return '🍽️'
    return '🍽️'
  }
  // activite
  if (nom.includes('baleine')) return '🐋'
  if (nom.includes('raie') || nom.includes('manta')) return '🐠'
  if (nom.includes('requin')) return '🦈'
  if (nom.includes('tortue')) return '🐢'
  if (nom.includes('spectacle') || nom.includes('tiki') || nom.includes('danse')) return '🎭'
  if (nom.includes('kayak') || nom.includes('fond transparent') || nom.includes('lagoon')) return '⛵'
  if (nom.includes('snorkeling') || nom.includes('plongée') || nom.includes('corail')) return '🤿'
  if (nom.includes('plage') || nom.includes('pk18')) return '🏖️'
  if (nom.includes('rando') || nom.includes('montée') || nom.includes('belvédère') || nom.includes('pic')) return '🥾'
  if (nom.includes('restau') || nom.includes('snack') || nom.includes('bouffe') || nom.includes('coco beach')) return '🍽️'
  return '🏄'
}

/** Activités du jour à afficher sur le calendrier (transports + activites/bouffe réservés/payés) */
function getDayActivites(dateStr: string, activites: ActiviteCalendar[]): ActiviteCalendar[] {
  return activites.filter(a => {
    if (!a.date_heure?.startsWith(dateStr)) return false
    if (a.categorie === 'transport') return true
    return (a.statut === 'reserve' || a.statut === 'paye')
  })
}

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

export default function PlanningClient({ planning, activites }: { planning: PlanningRow[]; activites: ActiviteCalendar[] }) {
  const [vue, setVue] = useState<'timeline' | 'calendrier'>('timeline')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const weeks = useMemo(() => buildCalendarWeeks(planning), [planning])
  const todayStr = toDateStr(new Date())

  return (
    <div>
      <div className="px-5 pt-8 pb-4 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Planning</h1>
          <p className="text-slate-400 text-sm mt-0.5">4 sept → 2 oct · 28 nuits</p>
        </div>
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
                    <div
                      className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 bg-white shadow-sm"
                      style={{ borderColor: isVol ? '#e2e8f0' : (hex ?? '#0ea5e9') }}
                    >
                      {isVol ? '✈️' : getEmoji(etape.lieu)}
                    </div>
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
        <div className="px-4 pb-4 space-y-3">
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
            {/* En-têtes jours */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((j, i) => (
                <div key={i} className="text-center py-2 text-[10px] font-bold text-slate-400 uppercase">{j}</div>
              ))}
            </div>

            {/* Semaines */}
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-slate-100 last:border-0">
                {week.map(({ date, dateStr, inTrip, etape }) => {
                  const isSejour  = etape?.type === 'sejour'
                  const hex       = isSejour ? getHex(etape!.lieu) : null
                  const isToday   = dateStr === todayStr
                  const isSelected = selectedDay === dateStr
                  const dayActs   = inTrip ? getDayActivites(dateStr, activites) : []

                  return (
                    <button
                      key={dateStr}
                      onClick={() => inTrip && setSelectedDay(isSelected ? null : dateStr)}
                      className={`relative min-h-[80px] p-1.5 border-r border-slate-100 last:border-0 flex flex-col text-left transition-colors select-none ${
                        !inTrip ? 'bg-slate-50/30' : isSelected ? 'bg-sky-50 ring-2 ring-inset ring-sky-400' : 'hover:bg-black/[.02]'
                      }`}
                      style={hex && !isSelected ? { backgroundColor: `${hex}18` } : undefined}
                    >
                      {/* Numéro du jour */}
                      <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ${
                        isToday
                          ? 'bg-sky-600 text-white'
                          : isSelected ? 'bg-sky-100 text-sky-700'
                          : inTrip ? 'text-slate-800' : 'text-slate-300'
                      }`}>
                        {date.getDate()}
                      </span>

                      {/* Mois si 1er */}
                      {date.getDate() === 1 && (
                        <span className="text-[8px] font-semibold text-slate-400 uppercase leading-none">
                          {date.toLocaleDateString('fr-FR', { month: 'short' })}
                        </span>
                      )}

                      {/* Vol itinéraire international — uniquement sur les jours aller/retour */}
                      {etape && inTrip && etape.type !== 'sejour' && (
                        <div className="flex-1 flex items-center justify-center">
                          <span className="text-base leading-none">✈️</span>
                        </div>
                      )}

                      {/* Emojis des activités du jour */}
                      {dayActs.length > 0 && (
                        <div className="flex flex-wrap gap-x-0.5 gap-y-0 mt-auto leading-none">
                          {dayActs.slice(0, 3).map(a => (
                            <span key={a.id} className="text-sm leading-tight">{getActiviteEmoji(a)}</span>
                          ))}
                          {dayActs.length > 3 && (
                            <span className="text-[8px] text-slate-400 self-end">+{dayActs.length - 3}</span>
                          )}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* ── Panneau détail du jour sélectionné ── */}
          {selectedDay && (() => {
            const etape = getEtapeForDay(selectedDay, planning)
            const dayActs = getDayActivites(selectedDay, activites)
            const flights = dayActs.filter(a => a.categorie === 'transport')
            const acts    = dayActs.filter(a => a.categorie !== 'transport')
            const dateLabel = new Date(selectedDay + 'T12:00:00').toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long'
            })
            const hex  = etape?.type === 'sejour' ? getHex(etape.lieu) : null
            const slug = etape?.type === 'sejour' ? getSlug(etape.lieu) : null

            return (
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between"
                  style={hex ? { backgroundColor: `${hex}15` } : undefined}>
                  <div className="flex items-center gap-2">
                    {etape && (
                      <span className="text-xl">
                        {etape.type !== 'sejour' ? '✈️' : getEmoji(etape.lieu)}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-900 capitalize">{dateLabel}</p>
                      {etape && (
                        <p className="text-xs font-medium" style={{ color: hex ?? '#64748b' }}>
                          {etape.lieu}{etape.notes ? ` · ${etape.notes}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelectedDay(null)}
                    className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1">✕</button>
                </div>

                {/* Vols internes */}
                {flights.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vols</p>
                    {flights.map(a => (
                      <div key={a.id} className="flex items-start gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0">
                        <span className="text-base mt-0.5">{getActiviteEmoji(a)}</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{a.nom}</p>
                          {a.date_heure?.includes(' ') && (
                            <p className="text-xs text-sky-600 font-medium">{a.date_heure.split(' ')[1]}</p>
                          )}
                          {a.lieu && <p className="text-xs text-slate-400">📍 {a.lieu}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Activités + restos */}
                {acts.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activités</p>
                    {acts.map(a => (
                      <div key={a.id} className="flex items-start gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0">
                        <span className="text-base mt-0.5">{getActiviteEmoji(a)}</span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{a.nom}</p>
                          {a.date_heure?.includes(' ') && (
                            <p className="text-xs text-emerald-600 font-medium">{a.date_heure.split(' ')[1]}</p>
                          )}
                          {a.lieu && <p className="text-xs text-slate-400">📍 {a.lieu}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rien ce jour */}
                {flights.length === 0 && acts.length === 0 && (
                  <p className="px-4 py-3 text-xs text-slate-400">
                    {etape ? `Séjour à ${etape.lieu} · aucune activité programmée.` : 'Aucune activité programmée ce jour.'}
                  </p>
                )}

                {slug && (
                  <div className="px-4 pb-3 pt-1">
                    <Link href={`/iles/${slug}`}
                      className="text-xs font-semibold hover:opacity-70 transition-opacity"
                      style={{ color: hex ?? '#0ea5e9' }}>
                      Voir toutes les activités de {etape!.lieu} →
                    </Link>
                  </div>
                )}
              </div>
            )
          })()}

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
                <span className="text-xs">✈️</span>
                <span className="text-xs text-slate-600">Vol</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🏄</span>
                <span className="text-xs text-slate-600">Activité réservée</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🍽️</span>
                <span className="text-xs text-slate-600">Resto réservé</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
