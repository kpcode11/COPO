'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import Badge from '@/components/ui/badge'
import Alert from '@/components/ui/alert'
import { PageLoader } from '@/components/ui/spinner'
import Toast from '@/components/ui/toast'
import { getCqiActions, createCqiAction, updateCqiAction } from '@/actions/teacher/cqi.actions'
import { ArrowLeft, AlertTriangle, CheckCircle2, FileText, Save } from 'lucide-react'

interface CqiForm {
  issueAnalysis: string
  actionTaken: string
  proposedImprovement: string
  status: string
  remarks: string
}

const STATUS_OPTIONS = [
  { value: 'PLANNED', label: 'Planned' },
  { value: 'IMPLEMENTED', label: 'Implemented' },
  { value: 'VERIFIED', label: 'Verified' },
]

export default function CourseCqiPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const [actionItems, setActionItems] = useState<any[]>([])
  const [targetLevel, setTargetLevel] = useState(2.5)
  const [loading, setLoading] = useState(true)
  const [forms, setForms] = useState<Record<string, CqiForm>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCqiActions(courseId)
      if ('error' in res) { setToast({ message: res.error as string, type: 'error' }); return }
      setActionItems(res.actionItems ?? [])
      setTargetLevel(res.targetLevel ?? 2.5)

      // Initialize forms
      const formInit: Record<string, CqiForm> = {}
      for (const item of (res.actionItems ?? [])) {
        const existing = item.existingAction
        if (existing) {
          // Parse remarks back into fields
          const remarks = existing.remarks || ''
          const issueMatch = remarks.match(/Issue: (.+?)(?:\n|$)/)
          const improvementMatch = remarks.match(/Improvement: (.+?)(?:\n|$)/)
          const notesMatch = remarks.match(/Notes: (.+?)(?:\n|$)/)
          formInit[item.co.id] = {
            issueAnalysis: issueMatch?.[1] ?? '',
            actionTaken: existing.actionTaken,
            proposedImprovement: improvementMatch?.[1] ?? '',
            status: existing.status === 'PENDING' ? 'PLANNED' : existing.status,
            remarks: notesMatch?.[1] ?? '',
          }
        } else {
          formInit[item.co.id] = {
            issueAnalysis: '',
            actionTaken: '',
            proposedImprovement: '',
            status: 'PLANNED',
            remarks: '',
          }
        }
      }
      setForms(formInit)
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => { fetchData() }, [fetchData])

  const updateForm = (coId: string, field: string, value: string) => {
    setForms(prev => ({
      ...prev,
      [coId]: { ...prev[coId], [field]: value },
    }))
  }

  const handleSave = async (item: any) => {
    const form = forms[item.co.id]
    if (!form) return
    if (!form.issueAnalysis || !form.actionTaken || !form.proposedImprovement) {
      setToast({ message: 'Please fill in all required fields', type: 'error' })
      return
    }

    setSaving(prev => ({ ...prev, [item.co.id]: true }))
    try {
      if (item.existingAction) {
        const res = await updateCqiAction(courseId, item.existingAction.id, {
          issueAnalysis: form.issueAnalysis,
          actionTaken: form.actionTaken,
          proposedImprovement: form.proposedImprovement,
          status: form.status,
          remarks: form.remarks,
        })
        if ('error' in res) { setToast({ message: res.error as string, type: 'error' }); return }
        setToast({ message: `CQI for ${item.co.code} updated`, type: 'success' })
      } else {
        const res = await createCqiAction(courseId, {
          courseOutcomeId: item.co.id,
          issueAnalysis: form.issueAnalysis,
          actionTaken: form.actionTaken,
          proposedImprovement: form.proposedImprovement,
          status: form.status,
          remarks: form.remarks,
        })
        if ('error' in res) { setToast({ message: res.error as string, type: 'error' }); return }
        setToast({ message: `CQI for ${item.co.code} submitted`, type: 'success' })
      }
      fetchData()
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setSaving(prev => ({ ...prev, [item.co.id]: false }))
    }
  }

  if (loading) return <PageLoader label="Loading CQI data..." />

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/teacher/courses/${courseId}`} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Course
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">CQI / Action Taken</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Submit action taken and improvement plans for COs that are below the target level ({targetLevel}).
        </p>
      </div>

      {actionItems.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-gray-400">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-emerald-400" />
            <p className="text-sm font-medium text-gray-600">All COs meet the target level!</p>
            <p className="text-xs mt-1 text-gray-400">No CQI action required for this course.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <Alert type="info">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {actionItems.length} CO(s) are below the target level. Please provide action taken for each.
            </span>
          </Alert>

          {actionItems.map((item: any) => {
            const form = forms[item.co.id]
            if (!form) return null

            return (
              <Card key={item.co.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="primary">{item.co.code}</Badge>
                      <CardTitle className="text-sm">{item.co.description}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="danger" dot>
                        Score: {item.co.finalScore.toFixed(2)} / {targetLevel}
                      </Badge>
                      {item.existingAction && (
                        <Badge variant="success" dot>Submitted</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issue Analysis *</label>
                      <textarea
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        rows={3}
                        value={form.issueAnalysis}
                        onChange={(e) => updateForm(item.co.id, 'issueAnalysis', e.target.value)}
                        placeholder="Analyze why the CO was not achieved..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Action Taken *</label>
                      <textarea
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        rows={3}
                        value={form.actionTaken}
                        onChange={(e) => updateForm(item.co.id, 'actionTaken', e.target.value)}
                        placeholder="Describe the corrective action taken..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Improvement *</label>
                      <textarea
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        rows={3}
                        value={form.proposedImprovement}
                        onChange={(e) => updateForm(item.co.id, 'proposedImprovement', e.target.value)}
                        placeholder="What improvements are proposed for next semester..."
                      />
                    </div>
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                          value={form.status}
                          onChange={(e) => updateForm(item.co.id, 'status', e.target.value)}
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Remarks</label>
                        <textarea
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                          rows={2}
                          value={form.remarks}
                          onChange={(e) => updateForm(item.co.id, 'remarks', e.target.value)}
                          placeholder="Optional additional notes..."
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
                    <Button
                      onClick={() => handleSave(item)}
                      disabled={saving[item.co.id]}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {saving[item.co.id] ? 'Saving...' : item.existingAction ? 'Update' : 'Submit'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
