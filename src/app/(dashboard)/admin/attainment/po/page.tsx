'use client'
import React, { useEffect, useState, useCallback } from 'react'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import Select from '@/components/ui/select'
import Badge from '@/components/ui/badge'
import Alert from '@/components/ui/alert'
import Button from '@/components/ui/button'
import { PageLoader } from '@/components/ui/spinner'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '@/components/ui/table'
import { GraduationCap, ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { getAttainmentBadgeVariant } from '@/constants/attainment-levels'

interface Department { id: string; name: string }
interface Program { id: string; name: string; departmentId: string }

interface PoAttainment {
  id: string
  code: string
  description: string
  attainment: {
    directScore: number | null
    indirectScore: number | null
    finalScore: number | null
  } | null
}

export default function AdminPoAttainmentPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [poData, setPoData] = useState<PoAttainment[]>([])
  const [programInfo, setProgramInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadingPo, setLoadingPo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const [deptRes, progRes] = await Promise.all([
          fetch('/api/admin/departments'),
          fetch('/api/admin/programs'),
        ])
        const deptData = await deptRes.json()
        const progData = await progRes.json()
        setDepartments(deptData.departments ?? [])
        setPrograms(progData.programs ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const filteredPrograms = selectedDept
    ? programs.filter(p => p.departmentId === selectedDept)
    : programs

  const loadPoAttainment = useCallback(async (programId: string) => {
    if (!programId) { setPoData([]); setProgramInfo(null); return }
    setLoadingPo(true)
    setError(null)
    try {
      const res = await fetch(`/api/reports/program/${programId}/po-attainment`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPoData(data.outcomes ?? [])
      setProgramInfo(data.program ?? null)
    } catch (err: any) {
      setError(err.message || 'Failed to load PO attainment')
    } finally {
      setLoadingPo(false)
    }
  }, [])

  useEffect(() => {
    if (selectedProgram) loadPoAttainment(selectedProgram)
    else { setPoData([]); setProgramInfo(null) }
  }, [selectedProgram, loadPoAttainment])

  const handleExport = () => {
    if (!selectedProgram) return
    window.open(`/api/reports/export/excel?type=program&programId=${selectedProgram}`, '_blank')
  }

  const getScoreLevel = (score: number | null): number => {
    if (score === null || score === undefined) return 0
    if (score >= 3) return 3
    if (score >= 2) return 2
    if (score >= 1) return 1
    return 0
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/attainment">
            <Button variant="ghost" className="p-1"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <GraduationCap className="h-6 w-6 text-gray-400" />
          <div>
            <h1 className="text-xl font-semibold">PO Attainment</h1>
            <p className="text-sm text-gray-500">View Program Outcome attainment levels for each program</p>
          </div>
        </div>
        {selectedProgram && (
          <Button variant="secondary" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export Excel
          </Button>
        )}
      </div>

      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Select
          label="Department"
          value={selectedDept}
          onChange={(v) => { setSelectedDept(v); setSelectedProgram('') }}
          options={[{ value: '', label: 'All Departments' }, ...departments.map(d => ({ value: d.id, label: d.name }))]}
          placeholder="Filter by department"
        />
        <Select
          label="Program"
          value={selectedProgram}
          onChange={setSelectedProgram}
          options={filteredPrograms.map(p => ({ value: p.id, label: p.name }))}
          placeholder="Select a program..."
        />
      </div>

      {!selectedProgram ? (
        <Card>
          <CardContent>
            <div className="text-center py-12 text-gray-400">
              <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Select a program to view PO attainment data</p>
            </div>
          </CardContent>
        </Card>
      ) : loadingPo ? (
        <PageLoader />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{programInfo?.name ?? 'PO Attainment'}</CardTitle>
            <CardDescription>{poData.length} program outcome(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>PO</TableHeader>
                  <TableHeader>Description</TableHeader>
                  <TableHeader>Direct Score</TableHeader>
                  <TableHeader>Indirect Score</TableHeader>
                  <TableHeader>Final Score</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {poData.length === 0 ? (
                  <TableEmpty columns={6} message="No PO attainment data available for this program" />
                ) : (
                  poData.map(po => (
                    <TableRow key={po.id}>
                      <TableCell><Badge variant="success">{po.code}</Badge></TableCell>
                      <TableCell className="text-sm max-w-62.5 truncate">{po.description}</TableCell>
                      <TableCell>
                        {po.attainment?.directScore !== null && po.attainment?.directScore !== undefined
                          ? <span className="font-mono text-sm">{po.attainment.directScore.toFixed(2)}</span>
                          : <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell>
                        {po.attainment?.indirectScore !== null && po.attainment?.indirectScore !== undefined
                          ? <span className="font-mono text-sm">{po.attainment.indirectScore.toFixed(2)}</span>
                          : <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell>
                        {po.attainment?.finalScore !== null && po.attainment?.finalScore !== undefined
                          ? <span className="font-mono text-sm font-semibold">{po.attainment.finalScore.toFixed(2)}</span>
                          : <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getAttainmentBadgeVariant(getScoreLevel(po.attainment?.finalScore ?? null))}>
                          {po.attainment?.finalScore !== null && po.attainment?.finalScore !== undefined
                            ? (po.attainment.finalScore >= 2.5 ? 'Achieved' : 'Not Achieved')
                            : 'N/A'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
