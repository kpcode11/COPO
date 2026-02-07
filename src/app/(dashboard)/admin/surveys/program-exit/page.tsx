'use client'
import React, { useEffect, useState, useCallback } from 'react'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Badge from '@/components/ui/badge'
import Alert from '@/components/ui/alert'
import { PageLoader } from '@/components/ui/spinner'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '@/components/ui/table'
import Modal from '@/components/ui/modal'
import ConfirmModal from '@/components/modals/confirm-modal'
import { GraduationCap, Plus, Trash2, ArrowLeft, GripVertical } from 'lucide-react'
import Link from 'next/link'
import { SURVEY_OPTIONS_LIST } from '@/constants/survey-options'

interface Question {
  code: string
  text: string
}

interface SurveyTemplate {
  id: string
  type: string
  template: Question[]
  createdBy: string
  createdAt: string
}

export default function ProgramExitSurveyPage() {
  const [templates, setTemplates] = useState<SurveyTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([
    { code: 'PO1', text: '' }, { code: 'PO2', text: '' }, { code: 'PO3', text: '' },
    { code: 'PO4', text: '' }, { code: 'PO5', text: '' }, { code: 'PO6', text: '' },
    { code: 'PO7', text: '' }, { code: 'PO8', text: '' }, { code: 'PO9', text: '' },
    { code: 'PO10', text: '' }, { code: 'PO11', text: '' }, { code: 'PO12', text: '' },
  ])
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [viewTemplate, setViewTemplate] = useState<SurveyTemplate | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/surveys/program/template')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTemplates(data.templates ?? [])
    } catch (err: any) {
      setError(err.message || 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const addQuestion = () => {
    const nextNum = questions.length + 1
    setQuestions([...questions, { code: `PO${nextNum}`, text: '' }])
  }

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx))
  }

  const updateQuestion = (idx: number, field: 'code' | 'text', value: string) => {
    const updated = [...questions]
    updated[idx] = { ...updated[idx], [field]: value }
    setQuestions(updated)
  }

  const handleCreate = async () => {
    const valid = questions.filter(q => q.code.trim())
    if (valid.length === 0) {
      setError('Add at least one question with a PO code')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/surveys/program/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: valid }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess('Program exit survey template created')
      setShowCreate(false)
      load()
    } catch (err: any) {
      setError(err.message || 'Failed to create template')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/surveys/${deleteId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess('Template deleted')
      setDeleteId(null)
      load()
    } catch (err: any) {
      setError(err.message || 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/surveys">
            <Button variant="ghost" className="p-1"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <GraduationCap className="h-6 w-6 text-gray-400" />
          <div>
            <h1 className="text-xl font-semibold">Program Exit Surveys</h1>
            <p className="text-sm text-gray-500">Create survey templates mapped to Program Outcomes (POs)</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Template
        </Button>
      </div>

      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
      {success && <div className="mb-4"><Alert type="success">{success}</Alert></div>}

      <div className="mb-4">
        <Alert type="info">
          Program exit surveys map questions to PO1–PO12. Students respond: {SURVEY_OPTIONS_LIST.map(o => o.label).join(', ')}.
        </Alert>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>{templates.length} program exit survey template(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Questions</TableHeader>
                <TableHeader>PO Codes</TableHeader>
                <TableHeader>Created</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.length === 0 ? (
                <TableEmpty columns={4} message="No program exit survey templates yet" />
              ) : (
                templates.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>{Array.isArray(t.template) ? t.template.length : 0}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(t.template) ? t.template : []).map((q: any, i: number) => (
                          <Badge key={i} variant="success">{q.code}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{new Date(t.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" className="p-1" onClick={() => setViewTemplate(t)}>View</Button>
                        <Button variant="ghost" className="p-1 text-red-500" onClick={() => setDeleteId(t.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Program Exit Survey Template">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {questions.map((q, idx) => (
            <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-1 text-gray-400 mt-2">
                <GripVertical className="h-4 w-4" />
                <span className="text-xs font-mono">{idx + 1}</span>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2">
                <Input
                  label="PO Code"
                  value={q.code}
                  onChange={(v) => updateQuestion(idx, 'code', v)}
                  placeholder="PO1"
                />
                <div className="col-span-2">
                  <Input
                    label="Question Text (optional)"
                    value={q.text}
                    onChange={(v) => updateQuestion(idx, 'text', v)}
                    placeholder="How confident are you in..."
                  />
                </div>
              </div>
              {questions.length > 1 && (
                <Button variant="ghost" className="p-1 mt-6 text-red-500" onClick={() => removeQuestion(idx)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3">
          <Button variant="ghost" onClick={addQuestion}>
            <Plus className="h-4 w-4 mr-1" /> Add Question
          </Button>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating...' : 'Create Template'}
          </Button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewTemplate} onClose={() => setViewTemplate(null)} title="Survey Template Details">
        {viewTemplate && (
          <div>
            <div className="mb-3">
              <Badge variant="success">Program Exit Survey</Badge>
              <span className="text-sm text-gray-500 ml-2">Created {new Date(viewTemplate.createdAt).toLocaleString()}</span>
            </div>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>#</TableHeader>
                  <TableHeader>PO Code</TableHeader>
                  <TableHeader>Question</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {(Array.isArray(viewTemplate.template) ? viewTemplate.template : []).map((q: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell><Badge variant="success">{q.code}</Badge></TableCell>
                    <TableCell className="text-sm">{q.text || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium mb-1">Response Options:</p>
              <div className="flex gap-2">
                {SURVEY_OPTIONS_LIST.map(opt => (
                  <Badge key={opt.value} variant="default">{opt.label} ({opt.score})</Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        title="Delete Template"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      >
        Are you sure you want to delete this survey template?
      </ConfirmModal>
    </div>
  )
}
