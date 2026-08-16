'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const [code, setCode] = useState('')
  const [erreur, setErreur] = useState(false)
  const [chargement, setChargement] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setChargement(true)
    setErreur(false)
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    if (res.ok) {
      router.push(from)
      router.refresh()
    } else {
      setErreur(true)
      setChargement(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-end justify-center pb-16"
      style={{
        background: 'linear-gradient(160deg, #0c4a6e 0%, #0284c7 40%, #06b6d4 70%, #059669 100%)',
      }}
    >
      {/* Vague décorative */}
      <svg className="absolute bottom-0 inset-x-0 w-full pointer-events-none" viewBox="0 0 1440 200" preserveAspectRatio="none">
        <path d="M0,100 C480,180 960,20 1440,100 L1440,200 L0,200 Z" fill="white" fillOpacity="0.08" />
      </svg>

      {/* Panel */}
      <div className="relative w-full max-w-sm mx-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
        {/* Titre */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🌺</div>
          <h1 className="text-3xl font-black text-white leading-tight">Tahiti 2026</h1>
          <p className="text-white/60 mt-1.5 text-sm">Régis · Isa · Agathe</p>
          <p className="text-white/40 mt-0.5 text-xs">Septembre – Octobre 2026</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white/80 mb-2">Code d&apos;accès</label>
            <input
              type="password"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/15 border border-white/25 rounded-2xl px-4 py-3.5 text-center text-xl tracking-widest text-white placeholder-white/30 focus:bg-white/25 focus:border-white/50 transition-all outline-none"
              autoFocus
            />
          </div>

          {erreur && (
            <p className="text-red-300 text-sm text-center bg-red-500/20 rounded-xl py-2">
              Code incorrect — réessaie !
            </p>
          )}

          <button
            type="submit"
            disabled={chargement || !code}
            className="w-full bg-white text-sky-800 font-black text-base py-4 rounded-2xl hover:bg-sky-50 disabled:opacity-50 transition-all shadow-lg shadow-black/20 active:scale-[.98]"
          >
            {chargement ? '...' : 'Entrer dans le voyage'}
          </button>
        </form>

        <p className="text-center text-xs text-white/30 mt-6">Site privé — accès restreint</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
