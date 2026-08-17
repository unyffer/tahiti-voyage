'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, Calendar, CreditCard } from 'lucide-react'
import { useRole } from '@/components/RoleContext'

const MAIN_TABS = [
  { href: '/',          label: 'Voyage',   Icon: Home },
  { href: '/carte',     label: 'Carte',    Icon: Map },
  { href: '/planning',  label: 'Planning', Icon: Calendar },
  { href: '/paiements', label: 'Finances', Icon: CreditCard },
]

const SECONDAIRES = [
  { href: '/journal',      label: 'Journal',    emoji: '📖' },
  { href: '/logements',    label: 'Logements',  emoji: '🏠' },
  { href: '/activites',    label: 'Activités',  emoji: '🎯' },
  { href: '/transports',   label: 'Transports', emoji: '✈️' },
  { href: '/checklist',    label: 'Checklist',  emoji: '✅' },
  { href: '/budget',       label: 'Budget',     emoji: '📊' },
  { href: '/iles/tahiti',  label: 'Îles',       emoji: '🌴' },
]

export default function DesktopSidebar() {
  const pathname = usePathname()
  const role = useRole()

  if (pathname === '/login') return null

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-slate-100 z-30 overflow-y-auto">
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Polynésie</p>
        <h1 className="text-xl font-black text-slate-900">Tahiti 2026</h1>
        <p className="text-xs text-slate-400 mt-1">Régis · Isa · Agathe</p>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 px-3 pb-4 space-y-0.5">
        {MAIN_TABS.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}>
              <Icon size={18} strokeWidth={active ? 2.2 : 1.7} />
              {label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-500" />}
            </Link>
          )
        })}

        {/* Séparateur */}
        <div className="px-3 pt-5 pb-2">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Contenu</p>
        </div>

        {SECONDAIRES.map(({ href, label, emoji }) => {
          const base = '/' + href.split('/')[1]
          const active = pathname === href || (base !== '/' && pathname.startsWith(base))
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? 'bg-sky-50 text-sky-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}>
              <span className="text-base w-5 text-center">{emoji}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100">
        {role === 'readonly' && (
          <div className="mb-3 px-3 py-2 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xs font-semibold text-amber-700">👁️ Mode lecture seule</p>
          </div>
        )}
        <p className="text-xs text-slate-400">🌺 Voyage privé — été 2026</p>
      </div>
    </aside>
  )
}
