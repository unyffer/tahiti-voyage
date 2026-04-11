/** Vérifie si une chaîne est une vraie URL (commence par http/https) */
export function isUrl(val: string | null | undefined): boolean {
  return !!val && (val.startsWith('http://') || val.startsWith('https://'))
}

/** Formate un montant en euros */
export function euros(n: number | null | undefined): string {
  if (n == null) return '–'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0
  }).format(n)
}
