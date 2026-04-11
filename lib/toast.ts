/** Affiche une notification toast depuis n'importe quel composant client */
export function showToast(message: string, type: 'error' | 'success' | 'warning' = 'error') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('tahiti-toast', { detail: { message, type } }))
}

/** Wrapper fetch qui gère automatiquement les erreurs 403 (readonly) et autres */
export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; data?: unknown }> {
  try {
    const res = await fetch(url, options)
    if (res.status === 403) {
      showToast('👁️ Mode lecture seule — modification non autorisée', 'warning')
      return { ok: false }
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      showToast(`Erreur : ${body.error ?? res.statusText}`, 'error')
      return { ok: false }
    }
    const data = await res.json().catch(() => null)
    return { ok: true, data }
  } catch {
    showToast('Erreur réseau — vérifiez votre connexion', 'error')
    return { ok: false }
  }
}
