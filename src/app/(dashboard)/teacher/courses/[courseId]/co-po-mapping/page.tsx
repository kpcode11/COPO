'use client'
import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Card, { CardHeader, CardTitle } from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import Alert from '@/components/ui/alert'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '@/components/ui/table'
import { PageLoader } from '@/components/ui/spinner'
import { getCoPoMappings } from '@/actions/teacher/co-po-mapping.actions'
import { ArrowLeft } from 'lucide-react'

export default function CoPoMappingPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCoPoMappings(courseId)
      if ('error' in res) setError(res.error as string)
      else setData(res)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <PageLoader label="Loading CO-PO mappings..." />
  if (error) return <Alert type="error">{error}</Alert>
  if (!data) return null

  const { cos = [], pos = [], mappings = [] } = data as { cos: any[]; pos: any[]; mappings: any[] }
  const getMappingValue = (coId: string, poId: string) => {
    const m = mappings.find((m: any) => m.courseOutcomeId === coId && m.programOutcomeId === poId)
    return m ? m.value : null
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/teacher/courses/${courseId}`} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Course
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">CO-PO Mapping Matrix</h1>
        <p className="text-sm text-gray-500 mt-0.5">Read-only view of course outcome to program outcome mappings.</p>
      </div>

      {cos.length === 0 || pos.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">
              {cos.length === 0 ? 'No course outcomes defined.' : 'No program outcomes found for this program.'}
            </p>
          </div>
        </Card>
      ) : (
        <Card padding={false}>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>CO / PO</TableHeader>
                {pos.map((po: any) => (
                  <TableHeader key={po.id} className="text-center">{po.code}</TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {cos.map((co: any) => (
                <TableRow key={co.id}>
                  <TableCell><Badge variant="primary">{co.code}</Badge></TableCell>
                  {pos.map((po: any) => {
                    const val = getMappingValue(co.id, po.id)
                    return (
                      <TableCell key={po.id} className="text-center">
                        {val !== null ? (
                          <Badge variant={val === 3 ? 'success' : val === 2 ? 'primary' : val === 1 ? 'warning' : 'default'}>
                            {val}
                          </Badge>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
