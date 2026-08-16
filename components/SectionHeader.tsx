interface SectionHeaderProps {
  eyebrow?: string
  title: string
  action?: React.ReactNode
}

export default function SectionHeader({ eyebrow, title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{eyebrow}</p>
        )}
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
