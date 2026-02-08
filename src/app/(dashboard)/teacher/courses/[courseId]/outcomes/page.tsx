'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Badge from '@/components/ui/badge'
import Alert from '@/components/ui/alert'
import Modal from '@/components/ui/modal'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '@/components/ui/table'
import { PageLoader } from '@/components/ui/spinner'
import Toast from '@/components/ui/toast'
import { getCourseOutcomes, createCourseOutcome, updateCourseOutcome, deleteCourseOutcome } from '@/actions/teacher/course-outcome.actions'
import { getCourseOverview } from '@/actions/teacher/co-po-mapping.actions'
import { BLOOM_LEVELS } from '@/constants/bloom-levels'
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react'

export default function CourseOutcomesPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const [outcomes, setOutcomes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCO, setEditingCO] = useState<any>(null)
  const [formData, setFormData] = useState({ code: '', description: '', bloomLevels: [] as string[] })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [coRes, courseRes] = await Promise.all([
        getCourseOutcomes(courseId),
        getCourseOverview(courseId),
      ])
      if ('outcomes' in coRes) setOutcomes(coRes.outcomes ?? [])
      if ('course' in courseRes) setIsLocked(courseRes.course?.semester?.isLocked ?? false)
      if ('error' in coRes) setError(coRes.error as string)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => { fetchData() }, [fetchData])

  const openCreate = () => {
    const nextNum = outcomes.length + 1
    setEditingCO(null)
    setFormData({ code: `CO${nextNum}`, description: '', bloomLevels: ['Remember'] })
    setModalOpen(true)
  }

  const openEdit = (co: any) => {
    setEditingCO(co)
    setFormData({ code: co.code, description: co.description, bloomLevels: co.bloomLevels || [] })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editingCO) {
        const res = await updateCourseOutcome(courseId, editingCO.id, {
          description: formData.description,
          bloomLevels: formData.bloomLevels,
        })
        if ('error' in res) { setToast({ message: res.error as string, type: 'error' }); return }
        setToast({ message: 'Course outcome updated', type: 'success' })
      } else {
        const res = await createCourseOutcome(courseId, formData)
        if ('error' in res) { setToast({ message: res.error as string, type: 'error' }); return }
        setToast({ message: 'Course outcome created', type: 'success' })
      }
      setModalOpen(false)
      fetchData()
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (co: any) => {
    if (!confirm(`Delete ${co.code}? This cannot be undone.`)) return
    try {
      const res = await deleteCourseOutcome(courseId, co.id)
      if ('error' in res) { setToast({ message: res.error as string, type: 'error' }); return }
      setToast({ message: `${co.code} deleted`, type: 'success' })
      fetchData()
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' })
    }
  }

  if (loading) return <PageLoader label="Loading course outcomes..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/teacher/courses/${courseId}`} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Course
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Course Outcomes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Define CO1, CO2, etc. with Bloom&apos;s taxonomy levels.</p>
        </div>
        {!isLocked && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Add CO
          </Button>
        )}
      </div>

      {isLocked && (
        <Alert type="info">Semester is locked. Course outcomes are read-only.</Alert>
      )}

      {error && <Alert type="error">{error}</Alert>}

      <Card padding={false}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Code</TableHeader>
              <TableHeader>Description</TableHeader>
              <TableHeader>Bloom Levels</TableHeader>
              {!isLocked && <TableHeader className="text-right">Actions</TableHeader>}
            </TableRow>
          </TableHead>
          <TableBody>
            {outcomes.length === 0 ? (
              <TableEmpty columns={isLocked ? 3 : 4} message="No course outcomes defined yet." />
            ) : (
              outcomes.map((co: any) => (
                <TableRow key={co.id}>
                  <TableCell><Badge variant="primary">{co.code}</Badge></TableCell>
                  <TableCell className="max-w-md">{co.description}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(co.bloomLevels || []).map((bl: string) => (
                        <Badge key={bl} variant="default">
                          {BLOOM_LEVELS.find(b => b.value === bl)?.label ?? bl}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  {!isLocked && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" onClick={() => openEdit(co)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" onClick={() => handleDelete(co)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCO ? `Edit ${editingCO.code}` : 'Add Course Outcome'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formData.description || formData.bloomLevels.length === 0}>
              {saving ? 'Saving...' : editingCO ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-1">
          <Input
            label="CO Code"
            value={formData.code}
            onChange={(v) => setFormData(d => ({ ...d, code: v }))}
            disabled={!!editingCO}
            placeholder="CO1"
            required
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(v) => setFormData(d => ({ ...d, description: v }))}
            placeholder="Describe the course outcome..."
            required
          />
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Bloom Levels <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BLOOM_LEVELS.map((bl) => (
                <label
                  key={bl.value}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                    formData.bloomLevels.includes(bl.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.bloomLevels.includes(bl.value)}
                    onChange={(e) => {
                      setFormData((d) => ({
                        ...d,
                        bloomLevels: e.target.checked
                          ? [...d.bloomLevels, bl.value]
                          : d.bloomLevels.filter((v) => v !== bl.value),
                      }))
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{bl.label}</div>
                    <div className="text-xs text-gray-500">{bl.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
