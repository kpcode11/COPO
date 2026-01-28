'use client'
import React, { useState } from 'react'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'

export default function CourseOutcomeForm({ initial, onSave }: { initial?: any; onSave: (data: any) => Promise<void> }) {
  const [code, setCode] = useState(initial?.code || '')
  const [description, setDescription] = useState(initial?.description || '')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || !description) return
    await onSave({ code, description })
  }

  return (
    <form onSubmit={submit} className="max-w-md">
      <Input label="CO code" value={code} onChange={setCode} required />
      <Input label="Description" value={description} onChange={setDescription} required />
      <div className="mt-4"><Button type="submit" variant="primary">Save CO</Button></div>
    </form>
  )
}
