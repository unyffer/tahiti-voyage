'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Role = 'admin' | 'readonly' | null

const RoleContext = createContext<Role>(null)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null)

  useEffect(() => {
    // Lit le cookie tahiti_role (non-httpOnly, lisible en JS)
    const match = document.cookie.match(/(?:^|;\s*)tahiti_role=([^;]*)/)
    if (match) {
      setRole(match[1] as Role)
    } else {
      // Fallback : appel API si le cookie n'est pas lisible
      fetch('/api/me').then(r => r.json()).then(d => setRole(d.role))
    }
  }, [])

  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>
}

/** Hook : retourne 'admin', 'readonly', ou null (non connecté) */
export function useRole(): Role {
  return useContext(RoleContext)
}

/** Hook : true si l'utilisateur peut modifier les données */
export function useCanEdit(): boolean {
  return useContext(RoleContext) === 'admin'
}
