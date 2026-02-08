'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Select from '@/components/ui/select'
import Badge from '@/components/ui/badge'
import Alert from '@/components/ui/alert'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '@/components/ui/table'
import { PageLoader } from '@/components/ui/spinner'
import Toast from '@/components/ui/toast'
import { getQuestions, saveQuestions } from '@/actions/teacher/question-mapping.actions'
import { getCourseOutcomes } from '@/actions/teacher/course-outcome.actions'
import { getCourseOverview } from '@/actions/teacher/co-po-mapping.actions'
import { getAssessments } from '@/actions/teacher/assessment.actions'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'

interface QuestionRow {
  questionCode: string
  maxMarks: number
  courseOutcomeId: string
}

export default function AssessmentQuestionsPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const assessmentId = params.assessmentId as string
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [cos, setCos] = useState<any[]>([])
  const [assessment, setAssessment] = useState<any>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [qRes, coRes, courseRes, aRes] = await Promise.all([
        getQuestions(assessmentId, courseId),
        getCourseOutcomes(courseId),
        getCourseOverview(courseId),
        getAssessments(courseId),
      ])
      if ('questions' in qRes && qRes.questions && qRes.questions.length > 0) {
        setQuestions(qRes.questions.map((q: any) => ({
          questionCode: q.questionCode,
          maxMarks: q.maxMarks,
          courseOutcomeId: q.courseOutcomeId,
        })))
      }
      if ('outcomes' in coRes) setCos(coRes.outcomes ?? [])
      if ('course' in courseRes) setIsLocked(courseRes.course?.semester?.isLocked ?? false)
      if ('assessments' in aRes) {
        const a = aRes.assessments?.find((a: any) => a.id === assessmentId)
        setAssessment(a)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [courseId, assessmentId])

  useEffect(() => { fetchData() }, [fetchData])

  const addRow = () => {
    const nextNum = questions.length + 1
    setQuestions(prev => [...prev, { questionCode: `Q${nextNum}`, maxMarks: 0, courseOutcomeId: '' }])
  }

  const removeRow = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx))
  }

  const updateRow = (idx: number, field: string, value: string | number) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q))
  }

  const totalMarks = questions.reduce((s, q) => s + (q.maxMarks || 0), 0)
  const marksMatch = assessment ? totalMarks === assessment.totalMarks : true

  const handleSave = async () => {
    if (questions.length === 0) { setToast({ message: 'Add at least one question', type: 'error' }); return }
    if (questions.some(q => !q.courseOutcomeId)) { setToast({ message: 'All questions must be mapped to a CO', type: 'error' }); return }
    if (!marksMatch) { setToast({ message: `Total marks (${totalMarks}) must equal assessment marks (${assessment?.totalMarks})`, type: 'error' }); return }

    setSaving(true)
    try {
      const res = await saveQuestions(courseId, assessmentId, questions.map(q => ({
        questionCode: q.questionCode,
        maxMarks: Number(q.maxMarks),
        courseOutcomeId: q.courseOutcomeId,
      })))
      if ('error' in res) { setToast({ message: res.error as string, type: 'error' }); return }
      setToast({ message: 'Questions saved successfully', type: 'success' })
      fetchData()
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader label="Loading questions..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/teacher/courses/${courseId}/assessments`} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Assessments
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">
            Question Mapping {assessment ? `— ${assessment.type === 'IA1' ? 'IA-1' : assessment.type === 'IA2' ? 'IA-2' : 'End-Sem'}` : ''}
          </h1>
          {assessment && (
            <p className="text-sm text-gray-500 mt-0.5">Total marks: {assessment.totalMarks} | Map each question to exactly one CO.</p>
          )}
        </div>
        {!isLocked && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={addRow}><Plus className="h-4 w-4 mr-1" /> Add Question</Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save All'}
            </Button>
          </div>
        )}
      </div>

      {isLocked && <Alert type="info">Semester is locked. Question mappings are read-only.</Alert>}
      {error && <Alert type="error">{error}</Alert>}
      {cos.length === 0 && <Alert type="error">No COs defined. Please define course outcomes first.</Alert>}

      {!marksMatch && questions.length > 0 && (
        <Alert type="error">
          Sum of question marks ({totalMarks}) must equal assessment total marks ({assessment?.totalMarks}).
        </Alert>
      )}

      <Card padding={false}>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader className="w-32">Question Code</TableHeader>
              <TableHeader className="w-32">Max Marks</TableHeader>
              <TableHeader>Mapped CO</TableHeader>
              {!isLocked && <TableHeader className="w-20 text-right">Remove</TableHeader>}
            </TableRow>
          </TableHead>
          <TableBody>
            {questions.length === 0 ? (
              <TableEmpty columns={isLocked ? 3 : 4} message="No questions defined. Click 'Add Question' to start." />
            ) : (
              questions.map((q, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    {isLocked ? (
                      <Badge variant="primary">{q.questionCode}</Badge>
                    ) : (
                      <input
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
                        value={q.questionCode}
                        onChange={(e) => updateRow(idx, 'questionCode', e.target.value)}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {isLocked ? (
                      q.maxMarks
                    ) : (
                      <input
                        type="number"
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none"
                        value={q.maxMarks || ''}
                        onChange={(e) => updateRow(idx, 'maxMarks', parseInt(e.target.value) || 0)}
                        min={0}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {isLocked ? (
                      <Badge variant="default">{cos.find(c => c.id === q.courseOutcomeId)?.code ?? '—'}</Badge>
                    ) : (
                      <select
                        className="border border-gray-300 rounded px-2 py-1 text-sm bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none"
                        value={q.courseOutcomeId}
                        onChange={(e) => updateRow(idx, 'courseOutcomeId', e.target.value)}
                      >
                        <option value="">Select CO...</option>
                        {cos.map((co: any) => (
                          <option key={co.id} value={co.id}>{co.code} — {co.description.slice(0, 50)}</option>
                        ))}
                      </select>
                    )}
                  </TableCell>
                  {!isLocked && (
                    <TableCell className="text-right">
                      <Button variant="ghost" onClick={() => removeRow(idx)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {questions.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{questions.length} question(s) defined</span>
          <span className={marksMatch ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
            Total: {totalMarks} / {assessment?.totalMarks ?? '—'} marks
          </span>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
