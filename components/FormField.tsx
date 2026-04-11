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

export default function FormField({
  label, name, value, onChange, type = 'text', options, placeholder, required
}: FormFieldProps) {
  const base = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
  const val = value ?? ''

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={val}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={base}
        />
      ) : type === 'select' && options ? (
        <select
          name={name}
          value={val}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        >
          <option value="">— Choisir —</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={val}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={base}
        />
      )}
    </div>
  )
}
