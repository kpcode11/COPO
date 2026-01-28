'use client'
import React, { useEffect, useState } from 'react'
import CoursesTable from '@/components/tables/courses-table'
import CourseForm from '@/components/forms/course-form'
import Button from '@/components/ui/button'
import Alert from '@/components/ui/alert'

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [openForm, setOpenForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/courses')
      const data = await res.json()
      if (res.ok && data.courses) setCourses(data.courses)
      else setError(data.error || 'Failed to load courses')
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchCourses() }, [])

  const saveCourse = async (payload: any) => {
    setError(null)
    try {
      const res = await fetch('/api/admin/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Save failed')
      setOpenForm(false)
      fetchCourses()
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Courses</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => fetchCourses()}>Refresh</Button>
          <Button variant="primary" onClick={() => setOpenForm(true)}>Add course</Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? <div>Loading...</div> : <CoursesTable courses={courses} />}

      {openForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded w-full max-w-md">
            <h3 className="text-lg mb-3">Add course</h3>
            <CourseForm onSave={saveCourse} />
            <div className="mt-3 flex justify-end">
              <Button variant="secondary" onClick={() => setOpenForm(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
