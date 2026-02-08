'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/button'
import Badge from '@/components/ui/badge'
import Alert from '@/components/ui/alert'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '@/components/ui/table'
import { PageLoader } from '@/components/ui/spinner'
import Toast from '@/components/ui/toast'
import { getAttainmentResults, recalculateAttainment } from '@/actions/teacher/attainment.actions'
import { ATTAINMENT_LEVELS, getAttainmentLabel, getAttainmentBadgeVariant } from '@/constants/attainment-levels'
import { ArrowLeft, RefreshCw, Target, CheckCircle2, XCircle, Info } from 'lucide-react'

export default function CourseAttainmentPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAttainmentResults(courseId)
      if ('error' in res) setToast({ message: res.error as string, type: 'error' })
      else setData(res)
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRecalculate = async () => {
    setRecalculating(true)
    try {
      const res = await recalculateAttainment(courseId)
      if ('error' in res) { setToast({ message: res.error as string, type: 'error' }); return }
      setToast({ message: 'Attainment recalculated successfully', type: 'success' })
      fetchData()
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' })
    } finally {
      setRecalculating(false)
    }
  }

  if (loading) return <PageLoader label="Loading attainment..." />

  const results = data?.results ?? []
  const config = data?.config

  const levelToNum = (lvl: number | null | undefined) => lvl ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/teacher/courses/${courseId}`} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Course
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">CO Attainment Results</h1>
          <p className="text-sm text-gray-500 mt-0.5">System-calculated CO attainment. Read-only view.</p>
        </div>
        <Button variant="outline" onClick={handleRecalculate} disabled={recalculating}>
          <RefreshCw className={`h-4 w-4 mr-1 ${recalculating ? 'animate-spin' : ''}`} />
          {recalculating ? 'Recalculating...' : 'Recalculate'}
        </Button>
      </div>

      {/* Config Summary */}
      {config && (
        <Card>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span>Target Level: <strong className="text-gray-700">{config.poTargetLevel}</strong></span>
            <span>IA-1 Weight: <strong>{(config.ia1Weightage * 100).toFixed(0)}%</strong></span>
            <span>IA-2 Weight: <strong>{(config.ia2Weightage * 100).toFixed(0)}%</strong></span>
            <span>End-Sem Weight: <strong>{(config.endSemWeightage * 100).toFixed(0)}%</strong></span>
            <span>Direct: <strong>{(config.directWeightage * 100).toFixed(0)}%</strong></span>
            <span>Indirect: <strong>{(config.indirectWeightage * 100).toFixed(0)}%</strong></span>
            <span>L3 ≥ <strong>{config.level3Threshold}%</strong></span>
            <span>L2 ≥ <strong>{config.level2Threshold}%</strong></span>
            <span>L1 ≥ <strong>{config.level1Threshold}%</strong></span>
          </div>
        </Card>
      )}

      {results.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-gray-400">
            <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No attainment data calculated yet.</p>
            <p className="text-xs mt-1">Upload marks for all assessments, then click Recalculate.</p>
          </div>
        </Card>
      ) : (
        <Card padding={false}>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>CO</TableHeader>
                <TableHeader>IA-1 Level</TableHeader>
                <TableHeader>IA-2 Level</TableHeader>
                <TableHeader>End-Sem Level</TableHeader>
                <TableHeader>Direct Score</TableHeader>
                <TableHeader>Indirect Score</TableHeader>
                <TableHeader>Final Score</TableHeader>
                <TableHeader>Target</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div>
                      <Badge variant="primary">{r.code}</Badge>
                      <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{r.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.attainment ? (
                      <Badge variant={getAttainmentBadgeVariant(`LEVEL_${levelToNum(r.attainment.ia1Level)}`) as any}>
                        L{levelToNum(r.attainment.ia1Level)}
                      </Badge>
                    ) : <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell>
                    {r.attainment ? (
                      <Badge variant={getAttainmentBadgeVariant(`LEVEL_${levelToNum(r.attainment.ia2Level)}`) as any}>
                        L{levelToNum(r.attainment.ia2Level)}
                      </Badge>
                    ) : <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell>
                    {r.attainment ? (
                      <Badge variant={getAttainmentBadgeVariant(`LEVEL_${levelToNum(r.attainment.endSemLevel)}`) as any}>
                        L{levelToNum(r.attainment.endSemLevel)}
                      </Badge>
                    ) : <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell>
                    {r.attainment ? (
                      <span className="font-medium">{r.attainment.directScore.toFixed(2)}</span>
                    ) : <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell>
                    {r.attainment ? (
                      r.attainment.indirectScore > 0 ? (
                        <span className="font-medium">{r.attainment.indirectScore.toFixed(2)}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">Not available</span>
                      )
                    ) : <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell>
                    {r.attainment ? (
                      <span className="font-semibold text-gray-900">{r.attainment.finalScore.toFixed(2)}</span>
                    ) : <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">{r.targetLevel}</span>
                  </TableCell>
                  <TableCell>
                    {r.achieved === null ? (
                      <span className="text-gray-400">—</span>
                    ) : r.achieved ? (
                      <Badge variant="success" dot>
                        <CheckCircle2 className="h-3 w-3" /> Achieved
                      </Badge>
                    ) : (
                      <Badge variant="danger" dot>
                        <XCircle className="h-3 w-3" /> Below Target
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Info about survey */}
      <Card>
        <div className="flex items-start gap-2 text-sm text-gray-500">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Indirect CO scores come from course exit surveys uploaded by Admin.
            If survey data is not available, indirect score shows as &quot;Not available&quot; and
            the final score uses only the direct component.
          </p>
        </div>
      </Card>

      {/* CQI Prompt */}
      {results.some((r: any) => r.achieved === false) && (
        <Alert type="error">
          <div className="flex items-center justify-between">
            <span>Some COs are below target. Please submit CQI / Action Taken remarks.</span>
            <Link href={`/teacher/courses/${courseId}/cqi`}>
              <Button variant="danger" className="text-xs">Go to CQI</Button>
            </Link>
          </div>
        </Alert>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
