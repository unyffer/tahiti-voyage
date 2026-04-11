'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useRole } from '@/components/RoleContext'

const liens = [
  { href: '/', label: 'Accueil', emoji: '🏠' },
  { href: '/carte', label: 'Carte', emoji: '🗺️' },
  { href: '/planning', label: 'Planning', emoji: '📅' },
  { href: '/logements', label: 'Logements', emoji: '🏠' },
  { href: '/activites', label: 'Activités', emoji: '🎯' },
  { href: '/transports', label: 'Transports', emoji: '✈️' },
  { href: '/paiements', label: 'Paiements', emoji: '💸' },
  { href: '/checklist', label: 'Checklist', emoji: '✅' },
  { href: '/budget', label: 'Budget', emoji: '📊' },
]

export default function Nav() {
  const pathname = usePathname()
  const [menuOuvert, setMenuOuvert] = useState(false)
  const role = useRole()
  const isReadonly = role === 'readonly'

  if (pathname === '/login') return null

  return (
    <>
    {isReadonly && (
      <div className="bg-amber-400 text-amber-900 text-center text-xs font-semibold py-1.5 px-4">
        👁️ Mode lecture seule — vous pouvez consulter mais pas modifier les données
      </div>
    )}
    <nav className="bg-teal-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="font-bold text-lg flex items-center gap-2">
            🌺 <span className="hidden sm:inline">Tahiti 2026</span>
            {isReadonly && <span className="text-xs bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded font-semibold">Lecture</span>}
          </Link>

          {/* Desktop */}
          <div className="hidden lg:flex items-center gap-1">
            {liens.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === l.href
                    ? 'bg-teal-600 text-white'
                    : 'text-teal-100 hover:bg-teal-700'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Bouton menu mobile */}
          <button
            className="lg:hidden p-2 rounded-md text-teal-100 hover:bg-teal-700"
            onClick={() => setMenuOuvert(!menuOuvert)}
          >
            {menuOuvert ? '✕' : '☰'}
          </button>
        </div>

        {/* Menu mobile */}
        {menuOuvert && (
          <div className="lg:hidden pb-3 grid grid-cols-2 gap-1">
            {liens.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOuvert(false)}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                  pathname === l.href
                    ? 'bg-teal-600 text-white'
                    : 'text-teal-100 hover:bg-teal-700'
                }`}
              >
                <span>{l.emoji}</span>
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
    </>
  )
}
