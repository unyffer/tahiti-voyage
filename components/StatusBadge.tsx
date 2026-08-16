type StatutType = 'paye' | 'reserve' | 'a_faire' | 'solde' | string | null | undefined

const CONFIG: Record<string, { label: string; className: string }> = {
  paye:    { label: 'Payé',     className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  reserve: { label: 'Réservé', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  a_faire: { label: 'À faire', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  solde:   { label: '✓ Soldé', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

interface StatusBadgeProps {
  statut: StatutType
  className?: string
}

export default function StatusBadge({ statut, className = '' }: StatusBadgeProps) {
  if (!statut) return null
  const conf = CONFIG[statut] ?? { label: statut, className: 'bg-slate-50 text-slate-600 border-slate-200' }
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${conf.className} ${className}`}>
      {conf.label}
    </span>
  )
}
