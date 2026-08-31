import type { VolStatusResponse } from '@/app/api/vols-status/route'

type Statut = VolStatusResponse['statut']

const CONFIG: Record<Statut, { label: string; classes: string; dot: string }> = {
  Scheduled:   { label: 'À l\'heure',  classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  Expected:    { label: 'À l\'heure',  classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  EnRoute:     { label: 'En vol',      classes: 'bg-sky-50 text-sky-700 border-sky-200',             dot: 'bg-sky-500 animate-pulse' },
  Landed:      { label: 'Atterri',     classes: 'bg-slate-100 text-slate-600 border-slate-200',      dot: 'bg-slate-400' },
  Cancelled:   { label: 'Annulé',      classes: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500' },
  Diverted:    { label: 'Détourné',    classes: 'bg-orange-50 text-orange-700 border-orange-200',    dot: 'bg-orange-500' },
  Unknown:     { label: 'Inconnu',     classes: 'bg-slate-50 text-slate-400 border-slate-200',       dot: 'bg-slate-300' },
}

interface Props {
  statut: Statut
  retard?: number | null
  source?: VolStatusResponse['source']
  size?: 'sm' | 'md'
}

export default function FlightStatusBadge({ statut, retard, source, size = 'md' }: Props) {
  const cfg = CONFIG[statut] ?? CONFIG.Unknown
  const showDelay = statut === 'Scheduled' && retard && retard > 0

  if (source === 'unavailable') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold bg-slate-50 text-slate-400 border-slate-200`}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
        Non disponible
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border font-semibold ${
      size === 'sm' ? 'text-[10px]' : 'text-[11px]'
    } ${cfg.classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {showDelay ? `Retardé +${retard}min` : cfg.label}
    </span>
  )
}
