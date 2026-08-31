'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Home, Map, Calendar, CreditCard, Grid3X3 } from 'lucide-react'
import { useRole } from '@/components/RoleContext'

const MAIN_TABS = [
  { href: '/', label: 'Voyage', Icon: Home },
  { href: '/carte', label: 'Carte', Icon: Map },
  { href: '/planning', label: 'Planning', Icon: Calendar },
  { href: '/paiements', label: 'Finances', Icon: CreditCard },
]

const PLUS_LINKS = [
  { href: '/journal', label: 'Journal', emoji: '📖' },
  { href: '/logements', label: 'Logements', emoji: '🏠' },
  { href: '/activites', label: 'Activités', emoji: '🎯' },
  { href: '/vols', label: 'Vols', emoji: '✈️' },
  { href: '/transports', label: 'Transports', emoji: '🚌' },
  { href: '/checklist', label: 'Checklist', emoji: '✅' },
  { href: '/budget', label: 'Budget', emoji: '📊' },
  { href: '/iles/tahiti', label: 'Îles', emoji: '🌴' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [plusOpen, setPlusOpen] = useState(false)
  const role = useRole()

  if (pathname === '/login') return null

  const plusRoutes = ['/journal', '/logements', '/activites', '/vols', '/transports', '/checklist', '/budget', '/iles']
  const isPlusActive = plusRoutes.some(r => pathname.startsWith(r))

  return (
    <>
      {/* Bandeau readonly — mobile uniquement (desktop : géré dans DesktopSidebar) */}
      {role === 'readonly' && (
        <div className="lg:hidden fixed top-0 inset-x-0 z-50 bg-amber-400 text-amber-900 text-center text-xs font-semibold py-2 px-4">
          👁️ Mode lecture seule
        </div>
      )}

      {/* Overlay + menu Plus — mobile uniquement */}
      {plusOpen && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setPlusOpen(false)}
          />
          <div className="fixed bottom-[64px] inset-x-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-slate-100 pt-3 pb-8 px-5">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">Navigation</p>
            <div className="grid grid-cols-3 gap-3">
              {PLUS_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setPlusOpen(false)}
                  className={`flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all active:scale-95 ${
                    pathname.startsWith(link.href.split('/').slice(0, 2).join('/'))
                      ? 'bg-sky-50 text-sky-600'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-2xl">{link.emoji}</span>
                  <span className="text-xs font-semibold">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar — mobile uniquement */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200"
        style={{ paddingBottom: 'max(var(--sab), 8px)' }}
      >
        <div className="max-w-2xl mx-auto flex">
          {MAIN_TABS.map(({ href, label, Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1 text-[11px] font-semibold transition-colors ${
                  active ? 'text-sky-600' : 'text-slate-400'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.2 : 1.5} />
                <span>{label}</span>
                {active && <span className="w-1 h-1 rounded-full bg-sky-600 mt-0.5" />}
              </Link>
            )
          })}

          {/* Plus */}
          <button
            onClick={() => setPlusOpen(!plusOpen)}
            className={`flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1 text-[11px] font-semibold transition-colors ${
              isPlusActive || plusOpen ? 'text-sky-600' : 'text-slate-400'
            }`}
          >
            <Grid3X3 size={22} strokeWidth={isPlusActive || plusOpen ? 2.2 : 1.5} />
            <span>Plus</span>
            {isPlusActive && !plusOpen && <span className="w-1 h-1 rounded-full bg-sky-600 mt-0.5" />}
          </button>
        </div>
      </nav>
    </>
  )
}
