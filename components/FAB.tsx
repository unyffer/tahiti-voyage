'use client'

import { Plus } from 'lucide-react'

interface FABProps {
  onClick: () => void
  label?: string
}

export default function FAB({ onClick, label }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label ?? 'Ajouter'}
      className="fixed bottom-24 right-4 z-20 flex items-center gap-2 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-full shadow-lg shadow-sky-600/30 transition-all px-4 py-3"
      style={{ bottom: 'max(calc(64px + var(--sab) + 16px), 88px)' }}
    >
      <Plus size={20} strokeWidth={2.5} />
      {label && <span className="text-sm font-semibold pr-1">{label}</span>}
    </button>
  )
}
