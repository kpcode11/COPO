'use client'
import React, { useState } from 'react'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'

export default function AssessmentForm({ initial, onSave }: { initial?: any; onSave: (data: any) => Promise<void> }) {
  const [type, setType] = useState(initial?.type || 'IA1')
  const [totalMarks, setTotalMarks] = useState(initial?.totalMarks ?? 100)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({ type, totalMarks })
  }

  return (
    <form onSubmit={submit} className="max-w-md">
      <Input label="Type" value={type} onChange={setType} required />
      <Input label="Total marks" value={String(totalMarks)} onChange={(v) => setTotalMarks(Number(v) || 0)} required />
      <div className="mt-4"><Button type="submit" variant="primary">Save Assessment</Button></div>
    </form>
  )
}
