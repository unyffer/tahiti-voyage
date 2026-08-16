'use client'

import { useEffect, useState } from 'react'

const DEPART = new Date('2026-09-04T00:00:00')

function calculer() {
  const now = new Date()
  const diff = DEPART.getTime() - now.getTime()
  if (diff <= 0) return { jours: 0, heures: 0, minutes: 0, passe: true }
  const jours = Math.floor(diff / (1000 * 60 * 60 * 24))
  const heures = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return { jours, heures, minutes, passe: false }
}

export default function CountdownHero() {
  const [c, setC] = useState(calculer)

  useEffect(() => {
    setC(calculer())
    const timer = setInterval(() => setC(calculer()), 60_000)
    return () => clearInterval(timer)
  }, [])

  if (c.passe) {
    return <p className="text-white/80 text-sm mt-3">✈️ Voyage en cours !</p>
  }

  const items = [
    { value: c.jours, label: c.jours > 1 ? 'jours' : 'jour' },
    { value: c.heures, label: 'h' },
  ]

  return (
    <div className="flex items-center gap-3 mt-4">
      <span className="text-white/60 text-sm font-medium">✈️ Départ dans</span>
      {items.map(({ value, label }) => (
        <div key={label} className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 text-center border border-white/20">
          <div className="text-3xl font-black text-white leading-none tabular-nums">{value}</div>
          <div className="text-xs text-white/70 mt-0.5 font-medium">{label}</div>
        </div>
      ))}
    </div>
  )
}
