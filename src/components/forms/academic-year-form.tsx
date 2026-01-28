'use client'
import React, { useState } from 'react'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'

export default function AcademicYearForm({ initial, onSave }: { initial?: any; onSave: (data: any) => Promise<void> }) {
  const [name, setName] = useState(initial?.name || '')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name) return setError('Name required')
    setLoading(true)
    try {
      await onSave({ name })
    } catch (err: any) {
      setError(err.message || 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md">
      <Input label="Name" value={name} onChange={setName} required />
      {error && <div className="text-red-600 mt-2">{error}</div>}
      <div className="mt-4"><Button type="submit" variant="primary" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button></div>
    </form>
  )
}
