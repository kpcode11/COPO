'use client'
import React, { useEffect, useState } from 'react'
import CoursesTable from '@/components/tables/courses-table'
import Alert from '@/components/ui/alert'

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">My courses</h1>
        <button onClick={() => fetchCourses()} className="text-sm text-blue-600">Refresh</button>
      </div>
      {error && <Alert type="error">{error}</Alert>}
      {loading ? <div>Loading...</div> : <CoursesTable courses={courses} />}
    </div>
  )
}
