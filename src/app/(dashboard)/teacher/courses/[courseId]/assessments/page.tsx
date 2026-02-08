'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Card, { CardHeader, CardTitle } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Badge from '@/components/ui/badge'
import Alert from '@/components/ui/alert'
import Modal from '@/components/ui/modal'
import { PageLoader } from '@/components/ui/spinner'
import Toast from '@/components/ui/toast'
import { getAssessments, createAssessment, deleteAssessment } from '@/actions/teacher/assessment.actions'
import { getCourseOverview } from '@/actions/teacher/co-po-mapping.actions'
import { ArrowLeft, Plus, FileText, Upload, List, Trash2 } from 'lucide-react'

const ASSESSMENT_TYPES = [
  { value: 'IA1', label: 'Internal Assessment 1 (IA-1)' },
  { value: 'IA2', label: 'Internal Assessment 2 (IA-2)' },
  { value: 'ENDSEM', label: 'End Semester Examination' },
]

const typeLabel = (t: string) => ASSESSMENT_TYPES.find(a => a.value === t)?.label ?? t

export default function CourseAssessmentsPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const [assessments, setAssessments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({ type: '', date: '', totalMarks: '' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [aRes, cRes] = await Promise.all([
        getAssessments(courseId),
        getCourseOverview(courseId),
      ])
      if ('assessments' in aRes) setAssessments(aRes.assessments ?? [])
      if ('course' in cRes) setIsLocked(cRes.course?.semester?.isLocked ?? false)
      if ('error' in aRes) setError(aRes.error as string)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => { fetchData() }, [fetchData])

  const existingTypes = assessments.map(a => a.type)
  const availableTypes = ASSESSMENT_TYPES.filter(t => !existingTypes.includes(t.value))

  const handleCreate = async () => {
    setSaving(true)
    try {
      const res = await createAssessment(courseId, {
        type: formData.type,
        date: formData.date,
        totalMarks: parseInt(formData.totalMarks),
      })
      if ('error' in res) { setToast({ message: res.error as string, type: 'error' }); return }
      setToast({ message: `${typeLabel(formData.type)} created`, type: 'success' })
      setModalOpen(false)
      fetchData()
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (assessment: any) => {
    if (!confirm(`Delete ${typeLabel(assessment.type)}? This cannot be undone.`)) return
    try {
      const res = await deleteAssessment(courseId, assessment.id)
      if ('error' in res) { setToast({ message: res.error as string, type: 'error' }); return }
      setToast({ message: 'Assessment deleted', type: 'success' })
      fetchData()
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' })
    }
  }

  if (loading) return <PageLoader label="Loading assessments..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/teacher/courses/${courseId}`} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Course
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Assessments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create IA-1, IA-2, and End-Sem assessments. Map questions and upload marks.</p>
        </div>
        {!isLocked && availableTypes.length > 0 && (
          <Button onClick={() => { setFormData({ type: availableTypes[0].value, date: '', totalMarks: '' }); setModalOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" /> Add Assessment
          </Button>
        )}
      </div>

      {isLocked && <Alert type="info">Semester is locked. Assessments are read-only.</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      {assessments.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-gray-400">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No assessments created yet.</p>
            {!isLocked && <p className="text-xs mt-1">Click &quot;Add Assessment&quot; to create IA-1, IA-2, or End-Sem.</p>}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {assessments.map((a: any) => (
            <Card key={a.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{typeLabel(a.type)}</CardTitle>
                  {!isLocked && (
                    <Button variant="ghost" onClick={() => handleDelete(a)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total Marks</span>
                  <span className="font-medium">{a.totalMarks}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Date</span>
                  <span>{new Date(a.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Questions</span>
                  <Badge variant={a.questions?.length > 0 ? 'success' : 'warning'}>
                    {a.questions?.length || 0} defined
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Marks</span>
                  <Badge variant={a.marksUploads?.length > 0 ? 'success' : 'default'}>
                    {a.marksUploads?.length > 0 ? 'Uploaded' : 'Not uploaded'}
                  </Badge>
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Link
                    href={`/teacher/courses/${courseId}/assessments/${a.id}/questions`}
                    className="flex-1 flex items-center justify-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <List className="h-3.5 w-3.5" /> Questions
                  </Link>
                  <Link
                    href={`/teacher/courses/${courseId}/assessments/${a.id}/marks`}
                    className="flex-1 flex items-center justify-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" /> Marks
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Assessment Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Assessment"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !formData.type || !formData.date || !formData.totalMarks}>
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="space-y-1">
          <Select
            label="Assessment Type"
            value={formData.type}
            onChange={(v) => setFormData(d => ({ ...d, type: v }))}
            options={availableTypes}
            required
          />
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(v) => setFormData(d => ({ ...d, date: v }))}
            required
          />
          <Input
            label="Total Marks"
            type="number"
            value={formData.totalMarks}
            onChange={(v) => setFormData(d => ({ ...d, totalMarks: v }))}
            placeholder="e.g., 30"
            required
          />
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
