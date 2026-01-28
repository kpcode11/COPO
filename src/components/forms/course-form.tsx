'use client'
import React, { useState } from 'react'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'

export default function CourseForm({ initial, onSave }: { initial?: any; onSave: (data: any) => Promise<void> }) {
  const [code, setCode] = useState(initial?.code || '')
  const [name, setName] = useState(initial?.name || '')
  const [credits, setCredits] = useState(initial?.credits ?? 3)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!code || !name) return setError('Code and name required')
    await onSave({ code, name, credits })
  }

  return (
    <form onSubmit={submit} className="max-w-md">
      <Input label="Code" value={code} onChange={setCode} required />
      <Input label="Name" value={name} onChange={setName} required />
      <Input label="Credits" value={String(credits)} onChange={(v) => setCredits(Number(v) || 0)} required />
      {error && <div className="text-red-600 mt-2">{error}</div>}
      <div className="mt-4"><Button type="submit" variant="primary">Save</Button></div>
    </form>
  )
}
