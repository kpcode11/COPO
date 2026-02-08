'use client'
import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Alert from '@/components/ui/alert'
import Card from '@/components/ui/card'
import Select from '@/components/ui/select'
import Badge from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/spinner'
import { getTeacherCoursesByFilter, getAcademicYearsAndSemesters } from '@/actions/teacher/co-po-mapping.actions'
import { BookOpen, ArrowRight, CheckCircle2, Lock } from 'lucide-react'

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAcademicYearsAndSemesters().then(res => {
      if ('academicYears' in res) {
        setAcademicYears(res.academicYears ?? [])
        // Default to active academic year
        const active = (res.academicYears ?? []).find((y: any) => y.isActive)
        if (active) setSelectedYear(active.id)
      }
    })
  }, [])

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getTeacherCoursesByFilter(
        selectedYear || undefined,
        selectedSemester || undefined
      )
      if ('error' in res) setError(res.error as string)
      else setCourses(res.courses || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedSemester])

  useEffect(() => { fetchCourses() }, [fetchCourses])

  const semesters = selectedYear
    ? academicYears.find((y: any) => y.id === selectedYear)?.semesters || []
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">My Courses</h1>
        <p className="mt-1 text-sm text-gray-500">Select an academic year and semester to view your assigned courses.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select
          label="Academic Year"
          value={selectedYear}
          onChange={(v) => { setSelectedYear(v); setSelectedSemester('') }}
          options={academicYears.map((y: any) => ({ value: y.id, label: y.name + (y.isActive ? ' (Active)' : '') }))}
          placeholder="All years"
          className="mb-0 w-60"
        />
        <Select
          label="Semester"
          value={selectedSemester}
          onChange={setSelectedSemester}
          options={semesters.map((s: any) => ({ value: s.id, label: `Sem ${s.number} (${s.type})` }))}
          placeholder="All semesters"
          disabled={!selectedYear}
          className="mb-0 w-60"
        />
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <PageLoader label="Loading courses..." />
      ) : courses.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-gray-400">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No courses assigned for this selection.</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course: any) => (
            <Link key={course.id} href={`/teacher/courses/${course.id}`}>
              <Card className="hover:border-blue-200 hover:shadow-md transition-all cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{course.code}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{course.name}</p>
                  </div>
                  {course.semester?.isLocked ? (
                    <Badge variant="warning" dot><Lock className="h-3 w-3 mr-0.5" />Locked</Badge>
                  ) : (
                    <Badge variant="success" dot>Active</Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500 space-y-1 mb-3">
                  <div>{course.semester?.academicYear?.name} &middot; Sem {course.semester?.number} ({course.semester?.type})</div>
                  <div>{course.department?.name} &middot; {course.program?.name}</div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
                  <span className="flex items-center gap-1">
                    {course._coCount > 0 ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <span className="h-3.5 w-3.5 rounded-full border border-gray-300 inline-block" />}
                    {course._coCount} COs
                  </span>
                  <span className="flex items-center gap-1">
                    {course._assessmentCount > 0 ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <span className="h-3.5 w-3.5 rounded-full border border-gray-300 inline-block" />}
                    {course._assessmentCount} Assessments
                  </span>
                  <span className="flex items-center gap-1">
                    {course._hasMarks ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <span className="h-3.5 w-3.5 rounded-full border border-gray-300 inline-block" />}
                    Marks
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300 ml-auto" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
