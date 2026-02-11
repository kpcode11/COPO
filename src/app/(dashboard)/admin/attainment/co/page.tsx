'use client'
import React, { useEffect, useState, useCallback } from 'react'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import Select from '@/components/ui/select'
import Badge from '@/components/ui/badge'
import Alert from '@/components/ui/alert'
import Button from '@/components/ui/button'
import { PageLoader } from '@/components/ui/spinner'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '@/components/ui/table'
import { BookOpen, ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { getAttainmentBadgeVariant, getAttainmentLabel } from '@/constants/attainment-levels'

interface Course {
  id: string
  code: string
  name: string
  departmentId: string
  department?: { name: string }
  program?: { name: string }
}

interface CoAttainment {
  id: string
  code: string
  description: string
  attainment: {
    ia1Level: string | null
    ia2Level: string | null
    endSemLevel: string | null
    directScore: number | null
    indirectScore: number | null
    finalScore: number | null
    level: string | null
  } | null
}

interface Department { id: string; name: string }

export default function AdminCoAttainmentPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [coData, setCoData] = useState<CoAttainment[]>([])
  const [courseInfo, setCourseInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadingCo, setLoadingCo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const [deptRes, courseRes] = await Promise.all([
          fetch('/api/admin/departments'),
          fetch('/api/admin/courses'),
        ])
        const deptData = await deptRes.json()
        const courseData = await courseRes.json()
        setDepartments(deptData.departments ?? [])
        setCourses(courseData.courses ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const filteredCourses = selectedDept
    ? courses.filter(c => c.departmentId === selectedDept)
    : courses

  const loadCoAttainment = useCallback(async (courseId: string) => {
    if (!courseId) { setCoData([]); setCourseInfo(null); return }
    setLoadingCo(true)
    setError(null)
    try {
      const res = await fetch(`/api/reports/course/${courseId}/co-attainment`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCoData(data.cos ?? [])
      setCourseInfo(data.course ?? null)
    } catch (err: any) {
      setError(err.message || 'Failed to load CO attainment')
    } finally {
      setLoadingCo(false)
    }
  }, [])

  useEffect(() => {
    if (selectedCourse) loadCoAttainment(selectedCourse)
    else { setCoData([]); setCourseInfo(null) }
  }, [selectedCourse, loadCoAttainment])

  const handleExport = () => {
    if (!selectedCourse) return
    window.open(`/api/reports/export/excel?type=course&courseId=${selectedCourse}`, '_blank')
  }

  const levelValue = (lvl: any): number => {
    if (lvl === null || lvl === undefined) return 0
    const s = String(lvl)
    const m = s.match(/\d+/)
    return m ? parseInt(m[0], 10) : 0
  }

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/attainment">
            <Button variant="ghost" className="p-1"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <BookOpen className="h-6 w-6 text-gray-400" />
          <div>
            <h1 className="text-xl font-semibold">CO Attainment</h1>
            <p className="text-sm text-gray-500">View Course Outcome attainment levels for each course</p>
          </div>
        </div>
        {selectedCourse && (
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
          onChange={(v) => { setSelectedDept(v); setSelectedCourse('') }}
          options={[{ value: '', label: 'All Departments' }, ...departments.map(d => ({ value: d.id, label: d.name }))]}
          placeholder="Filter by department"
        />
        <Select
          label="Course"
          value={selectedCourse}
          onChange={setSelectedCourse}
          options={filteredCourses.map(c => ({ value: c.id, label: `${c.code} – ${c.name}` }))}
          placeholder="Select a course..."
        />
      </div>

      {!selectedCourse ? (
        <Card>
          <CardContent>
            <div className="text-center py-12 text-gray-400">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Select a course to view CO attainment data</p>
            </div>
          </CardContent>
        </Card>
      ) : loadingCo ? (
        <PageLoader />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {courseInfo ? `${courseInfo.code} – ${courseInfo.name}` : 'CO Attainment'}
            </CardTitle>
            <CardDescription>{coData.length} course outcome(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>CO</TableHeader>
                  <TableHeader>Description</TableHeader>
                  <TableHeader>IA1</TableHeader>
                  <TableHeader>IA2</TableHeader>
                  <TableHeader>End Sem</TableHeader>
                  <TableHeader>Direct</TableHeader>
                  <TableHeader>Indirect</TableHeader>
                  <TableHeader>Final</TableHeader>
                  <TableHeader>Level</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {coData.length === 0 ? (
                  <TableEmpty columns={9} message="No CO attainment data available for this course" />
                ) : (
                  coData.map(co => (
                    <TableRow key={co.id}>
                      <TableCell><Badge variant="primary">{co.code}</Badge></TableCell>
                      <TableCell className="text-sm max-w-50 truncate">{co.description}</TableCell>
                      <TableCell>
                        {co.attainment?.ia1Level ? (
                          <Badge variant={getAttainmentBadgeVariant(levelValue(co.attainment.ia1Level))}>
                            {getAttainmentLabel(levelValue(co.attainment.ia1Level))}
                          </Badge>
                        ) : <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell>
                        {co.attainment?.ia2Level ? (
                          <Badge variant={getAttainmentBadgeVariant(levelValue(co.attainment.ia2Level))}>
                            {getAttainmentLabel(levelValue(co.attainment.ia2Level))}
                          </Badge>
                        ) : <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell>
                        {co.attainment?.endSemLevel ? (
                          <Badge variant={getAttainmentBadgeVariant(levelValue(co.attainment.endSemLevel))}>
                            {getAttainmentLabel(levelValue(co.attainment.endSemLevel))}
                          </Badge>
                        ) : <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell>
                        {co.attainment?.directScore !== null && co.attainment?.directScore !== undefined
                          ? <span className="font-mono text-sm">{co.attainment.directScore.toFixed(2)}</span>
                          : <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell>
                        {co.attainment?.indirectScore !== null && co.attainment?.indirectScore !== undefined
                          ? <span className="font-mono text-sm">{co.attainment.indirectScore.toFixed(2)}</span>
                          : <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell>
                        {co.attainment?.finalScore !== null && co.attainment?.finalScore !== undefined
                          ? <span className="font-mono text-sm font-semibold">{co.attainment.finalScore.toFixed(2)}</span>
                          : <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell>
                        {co.attainment?.level ? (
                          <Badge variant={getAttainmentBadgeVariant(levelValue(co.attainment.level))}>
                            {getAttainmentLabel(levelValue(co.attainment.level))}
                          </Badge>
                        ) : <Badge variant="default">N/A</Badge>}
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
