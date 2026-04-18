'use client'

import { useEffect, useState } from 'react'

const DEPART = new Date('2026-09-04T00:00:00')

function calculer() {
  const now = new Date()
  const diff = DEPART.getTime() - now.getTime()
  if (diff <= 0) return { mois: 0, jours: 0, passe: true }

  const totalJours = Math.floor(diff / (1000 * 60 * 60 * 24))
  const mois = Math.floor(totalJours / 30)
  const jours = totalJours % 30

  return { mois, jours, passe: false }
}

export default function Countdown() {
  const [compte, setCompte] = useState(calculer)

  useEffect(() => {
    setCompte(calculer())
    const timer = setInterval(() => setCompte(calculer()), 60_000)
    return () => clearInterval(timer)
  }, [])

  if (compte.passe) return null

  return (
    <div className="mt-5 flex items-center gap-4">
      <span className="text-teal-100 text-sm font-medium">✈️ Départ dans</span>
      <div className="flex gap-3">
        {compte.mois > 0 && (
          <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
            <div className="text-2xl font-bold text-white leading-none">{compte.mois}</div>
            <div className="text-xs text-teal-100 mt-0.5">{compte.mois > 1 ? 'mois' : 'mois'}</div>
          </div>
        )}
        <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
          <div className="text-2xl font-bold text-white leading-none">{compte.jours}</div>
          <div className="text-xs text-teal-100 mt-0.5">{compte.jours > 1 ? 'jours' : 'jour'}</div>
        </div>
      </div>
    </div>
  )
}
