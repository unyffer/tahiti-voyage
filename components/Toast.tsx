'use client'

import { useEffect, useState } from 'react'

interface ToastItem { id: number; message: string; type: 'error' | 'success' | 'warning' }

const STYLES = {
  error:   'bg-red-600 text-white',
  success: 'bg-emerald-600 text-white',
  warning: 'bg-amber-500 text-white',
}

const ICONS = { error: '❌', success: '✅', warning: '👁️' }

export default function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail as ToastItem
      const id = Date.now()
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500)
    }
    window.addEventListener('tahiti-toast', handler)
    return () => window.removeEventListener('tahiti-toast', handler)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] space-y-2 max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium animate-in slide-in-from-bottom-2 ${STYLES[t.type]}`}
        >
          <span className="flex-shrink-0">{ICONS[t.type]}</span>
          <span>{t.message}</span>
          <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="flex-shrink-0 opacity-70 hover:opacity-100 ml-1">✕</button>
        </div>
      ))}
    </div>
  )
}
