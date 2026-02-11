'use client'
import React, { useEffect, useState, useCallback } from 'react'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import Select from '@/components/ui/select'
import Badge from '@/components/ui/badge'
import Alert from '@/components/ui/alert'
import Button from '@/components/ui/button'
import Tabs from '@/components/ui/tabs'
import { PageLoader } from '@/components/ui/spinner'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '@/components/ui/table'
import { FileText, Download, Building2, BookOpen, GraduationCap, Calendar } from 'lucide-react'
import { getAttainmentBadgeVariant, getAttainmentLabel } from '@/constants/attainment-levels'

interface Department { id: string; name: string }
interface Program { id: string; name: string; departmentId: string }
interface Course { id: string; code: string; name: string; departmentId: string }
interface Semester { id: string; number: number; type: string; academicYear?: { name: string } }

export default function AdminReportsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')

  // Report data
  const [reportData, setReportData] = useState<any>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [activeReport, setActiveReport] = useState('')

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const [deptRes, progRes, courseRes, semRes] = await Promise.all([
          fetch('/api/admin/departments'),
          fetch('/api/admin/programs'),
          fetch('/api/admin/courses'),
          fetch('/api/admin/semesters'),
        ])
        setDepartments((await deptRes.json()).departments ?? [])
        setPrograms((await progRes.json()).programs ?? [])
        setCourses((await courseRes.json()).courses ?? [])
        setSemesters((await semRes.json()).semesters ?? [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const loadCourseReport = useCallback(async () => {
    if (!selectedCourse) return
    setReportLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reports/course/${selectedCourse}/co-attainment`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReportData(data)
      setActiveReport('course')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setReportLoading(false)
    }
  }, [selectedCourse])

  const loadProgramReport = useCallback(async () => {
    if (!selectedProgram) return
    setReportLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reports/program/${selectedProgram}/po-attainment`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReportData(data)
      setActiveReport('program')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setReportLoading(false)
    }
  }, [selectedProgram])

  const loadDeptReport = useCallback(async () => {
    if (!selectedDept) return
    setReportLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reports/department/${selectedDept}/summary`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReportData(data)
      setActiveReport('department')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setReportLoading(false)
    }
  }, [selectedDept])

  const loadSemesterReport = useCallback(async () => {
    if (!selectedSemester) return
    setReportLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reports/semester/${selectedSemester}/attainment`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setReportData(data)
      setActiveReport('semester')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setReportLoading(false)
    }
  }, [selectedSemester])

  const handleExport = (type: string) => {
    let url = `/api/reports/export/excel?type=${type}`
    if (type === 'course') url += `&courseId=${selectedCourse}`
    if (type === 'program') url += `&programId=${selectedProgram}`
    if (type === 'department') url += `&deptId=${selectedDept}`
    if (type === 'semester') url += `&semesterId=${selectedSemester}`
    window.open(url, '_blank')
  }

  const levelValue = (lvl: string | null): number => {
    if (!lvl) return 0
    return parseInt(lvl.replace('LEVEL_', '')) || 0
  }

  const filteredCourses = selectedDept ? courses.filter(c => c.departmentId === selectedDept) : courses
  const filteredPrograms = selectedDept ? programs.filter(p => p.departmentId === selectedDept) : programs

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-6 w-6 text-gray-400" />
        <div>
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="text-sm text-gray-500">Generate and export attainment reports</p>
        </div>
      </div>

      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

      <Tabs
        tabs={[
          { id: 'course', label: 'Course Report' },
          { id: 'program', label: 'Program Report' },
          { id: 'department', label: 'Department Report' },
          { id: 'semester', label: 'Semester Report' },
        ]}
        defaultTab="course"
        onChange={() => { setReportData(null); setActiveReport('') }}
      >
        {(tab) => (
          <>
            {tab === 'course' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Select
                    label="Department"
                    value={selectedDept}
                    onChange={(v) => { setSelectedDept(v); setSelectedCourse('') }}
                    options={[{ value: '', label: 'All' }, ...departments.map(d => ({ value: d.id, label: d.name }))]}
                    placeholder="Filter..."
                  />
                  <Select
                    label="Course"
                    value={selectedCourse}
                    onChange={setSelectedCourse}
                    options={filteredCourses.map(c => ({ value: c.id, label: `${c.code} – ${c.name}` }))}
                    placeholder="Select course..."
                  />
                  <div className="flex items-end gap-2 mb-4">
                    <Button variant="primary" onClick={loadCourseReport} disabled={!selectedCourse || reportLoading}>
                      {reportLoading ? 'Loading...' : 'Generate'}
                    </Button>
                    {activeReport === 'course' && (
                      <Button variant="secondary" onClick={() => handleExport('course')}>
                        <Download className="h-4 w-4 mr-1" /> Excel
                      </Button>
                    )}
                  </div>
                </div>
                {activeReport === 'course' && reportData && (
                  <Card>
                    <CardHeader>
                      <CardTitle><BookOpen className="h-4 w-4 inline mr-1" />{reportData.course?.code} – {reportData.course?.name}</CardTitle>
                      <CardDescription>CO Attainment Report</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableHeader>CO</TableHeader>
                            <TableHeader>Description</TableHeader>
                            <TableHeader>Direct</TableHeader>
                            <TableHeader>Indirect</TableHeader>
                            <TableHeader>Final</TableHeader>
                            <TableHeader>Level</TableHeader>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(reportData.cos ?? []).length === 0 ? (
                            <TableEmpty columns={6} message="No data" />
                          ) : (
                            (reportData.cos ?? []).map((co: any) => (
                              <TableRow key={co.id}>
                                <TableCell><Badge variant="primary">{co.code}</Badge></TableCell>
                                <TableCell className="text-sm">{co.description}</TableCell>
                                <TableCell className="font-mono text-sm">{co.attainment?.directScore?.toFixed(2) ?? '—'}</TableCell>
                                <TableCell className="font-mono text-sm">{co.attainment?.indirectScore?.toFixed(2) ?? '—'}</TableCell>
                                <TableCell className="font-mono text-sm font-semibold">{co.attainment?.finalScore?.toFixed(2) ?? '—'}</TableCell>
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
            )}

            {tab === 'program' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Select
                    label="Department"
                    value={selectedDept}
                    onChange={(v) => { setSelectedDept(v); setSelectedProgram('') }}
                    options={[{ value: '', label: 'All' }, ...departments.map(d => ({ value: d.id, label: d.name }))]}
                    placeholder="Filter..."
                  />
                  <Select
                    label="Program"
                    value={selectedProgram}
                    onChange={setSelectedProgram}
                    options={filteredPrograms.map(p => ({ value: p.id, label: p.name }))}
                    placeholder="Select program..."
                  />
                  <div className="flex items-end gap-2 mb-4">
                    <Button variant="primary" onClick={loadProgramReport} disabled={!selectedProgram || reportLoading}>
                      {reportLoading ? 'Loading...' : 'Generate'}
                    </Button>
                    {activeReport === 'program' && (
                      <Button variant="secondary" onClick={() => handleExport('program')}>
                        <Download className="h-4 w-4 mr-1" /> Excel
                      </Button>
                    )}
                  </div>
                </div>
                {activeReport === 'program' && reportData && (
                  <Card>
                    <CardHeader>
                      <CardTitle><GraduationCap className="h-4 w-4 inline mr-1" />{reportData.program?.name}</CardTitle>
                      <CardDescription>PO Attainment Report</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableHeader>PO</TableHeader>
                            <TableHeader>Description</TableHeader>
                            <TableHeader>Direct</TableHeader>
                            <TableHeader>Indirect</TableHeader>
                            <TableHeader>Final</TableHeader>
                            <TableHeader>Status</TableHeader>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(reportData.outcomes ?? []).length === 0 ? (
                            <TableEmpty columns={6} message="No data" />
                          ) : (
                            (reportData.outcomes ?? []).map((po: any) => (
                              <TableRow key={po.id}>
                                <TableCell><Badge variant="success">{po.code}</Badge></TableCell>
                                <TableCell className="text-sm">{po.description}</TableCell>
                                <TableCell className="font-mono text-sm">{po.attainment?.directScore?.toFixed(2) ?? '—'}</TableCell>
                                <TableCell className="font-mono text-sm">{po.attainment?.indirectScore?.toFixed(2) ?? '—'}</TableCell>
                                <TableCell className="font-mono text-sm font-semibold">{po.attainment?.finalScore != null ? po.attainment.finalScore.toFixed(2) : '—'}</TableCell>
                                <TableCell>
                                  {(() => {
                                    const final = po.attainment?.finalScore
                                    const variant = final != null ? (final >= 2.5 ? 3 : final >= 1.5 ? 1 : 0) : 0
                                    const label = final != null ? (final >= 2.5 ? 'Achieved' : 'Not Achieved') : 'N/A'
                                    return <Badge variant={getAttainmentBadgeVariant(variant)}>{label}</Badge>
                                  })()}
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
            )}

            {tab === 'department' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Select
                    label="Department"
                    value={selectedDept}
                    onChange={setSelectedDept}
                    options={departments.map(d => ({ value: d.id, label: d.name }))}
                    placeholder="Select department..."
                  />
                  <div className="flex items-end gap-2 mb-4">
                    <Button variant="primary" onClick={loadDeptReport} disabled={!selectedDept || reportLoading}>
                      {reportLoading ? 'Loading...' : 'Generate'}
                    </Button>
                    {activeReport === 'department' && (
                      <Button variant="secondary" onClick={() => handleExport('department')}>
                        <Download className="h-4 w-4 mr-1" /> Excel
                      </Button>
                    )}
                  </div>
                </div>
                {activeReport === 'department' && reportData && (
                  <div className="space-y-4">
                    {(reportData.data?.programs ?? []).map((prog: any) => (
                      <Card key={prog.program.id}>
                        <CardHeader>
                          <CardTitle><Building2 className="h-4 w-4 inline mr-1" />{prog.program.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableHeader>PO</TableHeader>
                                <TableHeader>Description</TableHeader>
                                <TableHeader>Direct</TableHeader>
                                <TableHeader>Indirect</TableHeader>
                                <TableHeader>Final</TableHeader>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(prog.outcomes ?? []).map((po: any) => (
                                <TableRow key={po.id}>
                                  <TableCell><Badge variant="success">{po.code}</Badge></TableCell>
                                  <TableCell className="text-sm">{po.description}</TableCell>
                                  <TableCell className="font-mono text-sm">{po.attainment?.directScore?.toFixed(2) ?? '—'}</TableCell>
                                  <TableCell className="font-mono text-sm">{po.attainment?.indirectScore?.toFixed(2) ?? '—'}</TableCell>
                                  <TableCell className="font-mono text-sm font-semibold">{po.attainment?.finalScore?.toFixed(2) ?? '—'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ))}
                    {(reportData.data?.programs ?? []).length === 0 && (
                      <Card><CardContent><p className="text-gray-400 text-center py-8">No programs found in this department</p></CardContent></Card>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === 'semester' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Select
                    label="Semester"
                    value={selectedSemester}
                    onChange={setSelectedSemester}
                    options={semesters.map(s => ({
                      value: s.id,
                      label: `Sem ${s.number} (${s.type})${s.academicYear ? ` – ${s.academicYear.name}` : ''}`,
                    }))}
                    placeholder="Select semester..."
                  />
                  <div className="flex items-end gap-2 mb-4">
                    <Button variant="primary" onClick={loadSemesterReport} disabled={!selectedSemester || reportLoading}>
                      {reportLoading ? 'Loading...' : 'Generate'}
                    </Button>
                    {activeReport === 'semester' && (
                      <Button variant="secondary" onClick={() => handleExport('semester')}>
                        <Download className="h-4 w-4 mr-1" /> Excel
                      </Button>
                    )}
                  </div>
                </div>
                {activeReport === 'semester' && reportData && (
                  <div className="space-y-4">
                    {(reportData.data?.courses ?? []).map((item: any) => (
                      <Card key={item.course.id}>
                        <CardHeader>
                          <CardTitle><Calendar className="h-4 w-4 inline mr-1" />{item.course.code} – {item.course.name}</CardTitle>
                          <CardDescription>{item.cos?.length ?? 0} course outcomes</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableHeader>CO</TableHeader>
                                <TableHeader>Description</TableHeader>
                                <TableHeader>Direct</TableHeader>
                                <TableHeader>Indirect</TableHeader>
                                <TableHeader>Final</TableHeader>
                                <TableHeader>Level</TableHeader>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(item.cos ?? []).map((co: any) => (
                                <TableRow key={co.id}>
                                  <TableCell><Badge variant="primary">{co.code}</Badge></TableCell>
                                  <TableCell className="text-sm">{co.description}</TableCell>
                                  <TableCell className="font-mono text-sm">{co.attainment?.directScore?.toFixed(2) ?? '—'}</TableCell>
                                  <TableCell className="font-mono text-sm">{co.attainment?.indirectScore?.toFixed(2) ?? '—'}</TableCell>
                                  <TableCell className="font-mono text-sm font-semibold">{co.attainment?.finalScore?.toFixed(2) ?? '—'}</TableCell>
                                  <TableCell>
                                    {co.attainment?.level ? (
                                      <Badge variant={getAttainmentBadgeVariant(levelValue(co.attainment.level))}>
                                        {getAttainmentLabel(levelValue(co.attainment.level))}
                                      </Badge>
                                    ) : <Badge variant="default">N/A</Badge>}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ))}
                    {(reportData.data?.courses ?? []).length === 0 && (
                      <Card><CardContent><p className="text-gray-400 text-center py-8">No courses found in this semester</p></CardContent></Card>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Tabs>
    </div>
  )
}
