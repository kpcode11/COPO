'use client'
import React from 'react'

type Props = {
  id?: string
  label?: string
  type?: string
  value?: string
  placeholder?: string
  error?: string | null
  required?: boolean
  onChange?: (v: string) => void
}

export default function Input({ id, label, type = 'text', value = '', placeholder, error = null, required = false, onChange }: Props) {
  // Use React's useId to generate a stable id that matches between server and client
  const reactId = React.useId()
  const inputId = id || `input-${reactId.replaceAll(':','')}`

  return (
    <div className="mb-4">
      {label && <label htmlFor={inputId} className="block text-sm font-medium mb-1">{label}{required ? ' *' : ''}</label>}
      <input
        id={inputId}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange && onChange(e.target.value)}
        className={`w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 ${error ? 'border-red-400' : 'border-gray-300'}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {error && <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
