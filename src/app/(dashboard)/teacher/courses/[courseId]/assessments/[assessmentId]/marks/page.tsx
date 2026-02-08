'use client'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Alert from '@/components/ui/alert'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '@/components/ui/table'
import { PageLoader } from '@/components/ui/spinner'
import Toast from '@/components/ui/toast'
import { validateMarksUpload, uploadMarks, getStudentMarks, getMarksUploadInfo, deleteMarks } from '@/actions/teacher/marks.actions'
import { getCourseOverview } from '@/actions/teacher/co-po-mapping.actions'
import { getAssessments } from '@/actions/teacher/assessment.actions'
import { useFileUpload } from '@/hooks/use-file-upload'
import { ArrowLeft, Upload, FileUp, Trash2, CheckCircle2, AlertTriangle, Download } from 'lucide-react'

export default function AssessmentMarksPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const assessmentId = params.assessmentId as string
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { file, headers, rows, error: fileError, loading: fileParsing, pickFile, reset } = useFileUpload()

  const [assessment, setAssessment] = useState<any>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [existingMarks, setExistingMarks] = useState<any>(null)
  const [uploadInfo, setUploadInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [step, setStep] = useState<'select' | 'preview' | 'done'>('select')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes, aRes, mRes, uRes] = await Promise.all([
        getCourseOverview(courseId),
        getAssessments(courseId),
        getStudentMarks(courseId, assessmentId),
        getMarksUploadInfo(courseId, assessmentId),
      ])
      if ('course' in cRes) setIsLocked(cRes.course?.semester?.isLocked ?? false)
      if ('assessments' in aRes) {
        const a = aRes.assessments?.find((a: any) => a.id === assessmentId)
        setAssessment(a)
      }
      if ('marks' in mRes) setExistingMarks(mRes)
      if ('upload' in uRes) setUploadInfo(uRes)
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [courseId, assessmentId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    await pickFile(f)
  }

  // After file is parsed, validate
  useEffect(() => {
    if (headers.length > 0 && rows.length > 0 && !fileError) {
      validateMarksUpload(courseId, assessmentId, headers, rows).then(res => {
        setValidationResult(res)
        setStep('preview')
      })
    }
  }, [headers, rows, fileError, courseId, assessmentId])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadMarks(courseId, assessmentId, file.name, headers, rows)
      if ('error' in res) {
        setToast({ message: res.error as string, type: 'error' })
        return
      }
      setToast({ message: `Successfully uploaded ${res.recordCount} student records`, type: 'success' })
      setStep('done')
      reset()
      fetchData()
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteMarks = async () => {
    if (!confirm('Delete all marks for this assessment? This cannot be undone.')) return
    try {
      const res = await deleteMarks(courseId, assessmentId)
      if ('error' in res) { setToast({ message: res.error as string, type: 'error' }); return }
      setToast({ message: 'Marks deleted', type: 'success' })
      fetchData()
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' })
    }
  }

  const resetUpload = () => {
    reset()
    setValidationResult(null)
    setStep('select')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (loading) return <PageLoader label="Loading marks..." />

  const assessmentLabel = assessment?.type === 'IA1' ? 'IA-1' : assessment?.type === 'IA2' ? 'IA-2' : 'End-Sem'
  const hasExistingMarks = existingMarks?.marks?.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/teacher/courses/${courseId}/assessments`} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Assessments
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">Marks Upload — {assessmentLabel}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Upload CSV/Excel with format: RollNo, Q1, Q2, ... | Total Marks: {assessment?.totalMarks ?? '—'}
          </p>
        </div>
      </div>

      {isLocked && <Alert type="info">Semester is locked. Marks upload is disabled.</Alert>}

      {/* Upload Info */}
      {uploadInfo?.upload && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-gray-500">Last upload:</span>{' '}
              <span className="font-medium">{uploadInfo.upload.fileName}</span>
              <span className="text-gray-400 ml-2">
                ({uploadInfo.studentCount} students, {new Date(uploadInfo.upload.uploadedAt).toLocaleString()})
              </span>
            </div>
            {!isLocked && (
              <Button variant="danger" onClick={handleDeleteMarks} className="text-xs">
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Marks
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* File Upload */}
      {!isLocked && step === 'select' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Marks File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileUp className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-3">
                Select a CSV or Excel file with headers: <code className="bg-gray-100 px-1 rounded">RollNo, Q1, Q2, Q3, ...</code>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={fileParsing}>
                {fileParsing ? 'Parsing...' : 'Choose File'}
              </Button>
              {fileError && <p className="mt-3 text-sm text-red-600">{fileError}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview & Validation */}
      {step === 'preview' && validationResult && (
        <div className="space-y-4">
          {/* Validation Status */}
          <Card>
            <div className="flex items-center gap-3">
              {validationResult.valid ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-500" />
              )}
              <div>
                <h3 className="font-medium text-gray-900">
                  {validationResult.valid ? 'Validation Passed' : 'Validation Failed'}
                </h3>
                <p className="text-sm text-gray-500">
                  {validationResult.recordCount} rows found in file: {file?.name}
                </p>
              </div>
            </div>
          </Card>

          {/* Errors */}
          {validationResult.errors?.length > 0 && (
            <Alert type="error">
              <ul className="list-disc list-inside space-y-1">
                {validationResult.errors.map((e: any, i: number) => (
                  <li key={i} className="text-sm">Row {e.row}: [{e.column}] {e.message}</li>
                ))}
              </ul>
            </Alert>
          )}

          {validationResult.summary?.invalidMarks?.length > 0 && (
            <Alert type="error">
              <h4 className="font-medium mb-1">Invalid marks found:</h4>
              <ul className="list-disc list-inside space-y-1">
                {validationResult.summary.invalidMarks.slice(0, 10).map((e: any, i: number) => (
                  <li key={i} className="text-sm">Row {e.row}: {e.column} = {e.value} — {e.message}</li>
                ))}
                {validationResult.summary.invalidMarks.length > 10 && (
                  <li className="text-sm text-gray-500">...and {validationResult.summary.invalidMarks.length - 10} more</li>
                )}
              </ul>
            </Alert>
          )}

          {/* Preview Table */}
          {validationResult.preview?.length > 0 && (
            <Card padding={false}>
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">Preview (first {validationResult.preview.length} rows)</h3>
              </div>
              <Table>
                <TableHead>
                  <TableRow>
                    {Object.keys(validationResult.preview[0]).map((h: string) => (
                      <TableHeader key={h}>{h}</TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validationResult.preview.map((row: any, i: number) => (
                    <TableRow key={i}>
                      {Object.values(row).map((v: any, j: number) => (
                        <TableCell key={j}>{String(v)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={resetUpload}>Cancel</Button>
            {validationResult.valid && (
              <Button onClick={handleUpload} disabled={uploading}>
                <Upload className="h-4 w-4 mr-1" />
                {uploading ? 'Uploading...' : hasExistingMarks ? 'Replace & Upload' : 'Upload Marks'}
              </Button>
            )}
          </div>
          {hasExistingMarks && validationResult.valid && (
            <Alert type="info">
              Existing marks will be replaced with the new upload.
            </Alert>
          )}
        </div>
      )}

      {/* Existing Marks Table */}
      {hasExistingMarks && step !== 'preview' && (
        <Card padding={false}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Current Marks ({existingMarks.marks.length} students)
            </h3>
          </div>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Roll No</TableHeader>
                {existingMarks.questions?.map((q: any) => (
                  <TableHeader key={q.id}>{q.questionCode} (/{q.maxMarks})</TableHeader>
                ))}
                <TableHeader>Total</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {existingMarks.marks.map((row: any, i: number) => {
                const total = existingMarks.questions?.reduce((s: number, q: any) => s + (row[q.questionCode] ?? 0), 0) ?? 0
                return (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.rollNo}</TableCell>
                    {existingMarks.questions?.map((q: any) => (
                      <TableCell key={q.id}>{row[q.questionCode] ?? 0}</TableCell>
                    ))}
                    <TableCell className="font-medium">{total}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
