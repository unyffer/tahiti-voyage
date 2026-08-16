'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface BottomSheetProps {
  titre?: string
  onClose: () => void
  children: React.ReactNode
}

export default function BottomSheet({ titre, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-auto bg-white rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Handle + header */}
        <div className="flex-shrink-0 pt-3 pb-0 px-5">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />
          {titre && (
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-900">{titre}</h2>
              <button
                onClick={onClose}
                className="p-2 -mr-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </div>
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {children}
        </div>
      </div>
    </div>
  )
}
