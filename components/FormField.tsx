interface FormFieldProps {
  label: string
  name: string
  value: string | number | null | undefined
  onChange: (val: string) => void
  type?: 'text' | 'number' | 'url' | 'date' | 'textarea' | 'select'
  options?: { value: string; label: string }[]
  placeholder?: string
  required?: boolean
}

const baseClass =
  'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 transition-colors'

export default function FormField({
  label, name, value, onChange, type = 'text', options, placeholder, required,
}: FormFieldProps) {
  const display = value == null ? '' : String(value)

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-sky-500 ml-0.5">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          id={name} name={name} value={display} required={required}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={`${baseClass} resize-none`}
        />
      ) : type === 'select' ? (
        <select
          id={name} name={name} value={display} required={required}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        >
          {options?.map(({ value: v, label: l }) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      ) : (
        <input
          id={name} name={name} type={type} value={display} required={required}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      )}
    </div>
  )
}
