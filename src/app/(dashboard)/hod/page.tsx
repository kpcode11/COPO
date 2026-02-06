'use client'
import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import useSession from '@/hooks/useSession'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import Alert from '@/components/ui/alert'
import { PageLoader } from '@/components/ui/spinner'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell, TableEmpty } from '@/components/ui/table'
import {
  Users,
  BookOpen,
  Target,
  CheckSquare,
  BarChart3,
  ArrowRight,
} from 'lucide-react'

interface DeptTeacher {
  id: string
  name: string
  email: string
  role: string
}

export default function HodDashboard() {
  const { user } = useSession()
  const [teachers, setTeachers] = useState<DeptTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTeachers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users?role=TEACHER')
      const data = await res.json()
      if (res.ok) setTeachers(data.users || [])
      else setError(data.error || 'Failed to load teachers')
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTeachers() }, [fetchTeachers])

  if (loading) return <PageLoader label="Loading department data…" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Department Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Hello, <span className="font-medium">{user?.name}</span>. Here&apos;s an overview of your department.
        </p>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{teachers.length}</div>
              <div className="text-xs text-gray-500">Teachers</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <BookOpen className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">—</div>
              <div className="text-xs text-gray-500">Courses</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Target className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">—</div>
              <div className="text-xs text-gray-500">Avg Attainment</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
              <CheckSquare className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">—</div>
              <div className="text-xs text-gray-500">CQI Pending</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Quick links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/dashboard/hod/courses" className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-gray-400" /> View Courses</span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
              </Link>
              <Link href="/dashboard/hod/attainment" className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <span className="flex items-center gap-2"><Target className="h-4 w-4 text-gray-400" /> Attainment Report</span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
              </Link>
              <Link href="/dashboard/hod/cqi-review" className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <span className="flex items-center gap-2"><CheckSquare className="h-4 w-4 text-gray-400" /> CQI Review</span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
              </Link>
              <Link href="/dashboard/hod/reports" className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-gray-400" /> Reports</span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Teachers table */}
        <div className="col-span-2">
          <Card padding={false}>
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Department Teachers</span>
              <Badge variant="default">{teachers.length} total</Badge>
            </div>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Role</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {teachers.length === 0 ? (
                  <TableEmpty columns={3} message="No teachers in this department" />
                ) : (
                  teachers.slice(0, 10).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{t.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{t.email}</TableCell>
                      <TableCell>
                        <Badge variant="success" dot>Teacher</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {teachers.length > 10 && (
              <div className="px-5 py-2 border-t border-gray-100 text-center">
                <Link href="/dashboard/hod/teachers" className="text-sm text-blue-600 hover:underline">
                  View all {teachers.length} teachers
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
