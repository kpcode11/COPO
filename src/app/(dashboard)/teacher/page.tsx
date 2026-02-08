'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import useSession from '@/hooks/useSession'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/spinner'
import {
  BookOpen,
  Target,
  FileText,
  ArrowRight,
  ClipboardList,
  Upload,
  AlertCircle,
} from 'lucide-react'
import { getTeacherCourses } from '@/actions/teacher/co-po-mapping.actions'

interface DashboardStats {
  totalCourses: number
  totalAssessments: number
  totalCOs: number
  coursesWithAttainment: number
  recentCourses: Array<{
    id: string
    code: string
    name: string
    semesterName: string
    locked: boolean
  }>
}

export default function TeacherDashboard() {
  const { user, loading } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const result = await getTeacherCourses()
        if ('courses' in result && result.courses) {
          const courses = result.courses as unknown as Array<{
            id: string
            code: string
            name: string
            semester: { number: number; type: string; isLocked: boolean; academicYear: { name: string } }
            _count: { outcomes: number; assessments: number }
          }>
          setStats({
            totalCourses: courses.length,
            totalAssessments: courses.reduce(
              (sum, c) => sum + (c._count?.assessments || 0),
              0
            ),
            totalCOs: courses.reduce(
              (sum, c) => sum + (c._count?.outcomes || 0),
              0
            ),
            coursesWithAttainment: 0,
            recentCourses: courses.slice(0, 5).map((c) => ({
              id: c.id,
              code: c.code,
              name: c.name,
              semesterName: `Sem ${c.semester?.number} (${c.semester?.academicYear?.name || ''})`,
              locked: c.semester?.isLocked || false,
            })),
          })
        }
      } catch {
        // stats remain null
      } finally {
        setStatsLoading(false)
      }
    }
    if (!loading && user) loadStats()
  }, [loading, user])

  if (loading) return <PageLoader label="Loading dashboard…" />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Teacher Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back, <span className="font-medium">{user?.name}</span>.
          Manage your courses, assessments, and attainment data.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">
                {statsLoading ? '…' : stats?.totalCourses ?? 0}
              </div>
              <div className="text-xs text-gray-500">Assigned Courses</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Target className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">
                {statsLoading ? '…' : stats?.totalCOs ?? 0}
              </div>
              <div className="text-xs text-gray-500">Course Outcomes</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <ClipboardList className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">
                {statsLoading ? '…' : stats?.totalAssessments ?? 0}
              </div>
              <div className="text-xs text-gray-500">Assessments</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick actions and recent courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link
                href="/teacher/courses"
                className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-400" />
                  View My Courses
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
              </Link>
              {stats && stats.recentCourses.length > 0 ? (
                <>
                  <Link
                    href={`/teacher/courses/${stats.recentCourses[0].id}`}
                    className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-gray-400" />
                      Go to {stats.recentCourses[0].code}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                  </Link>
                  <Link
                    href={`/teacher/courses/${stats.recentCourses[0].id}/attainment`}
                    className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-gray-400" />
                      View Attainment — {stats.recentCourses[0].code}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                  </Link>
                  <Link
                    href={`/teacher/courses/${stats.recentCourses[0].id}/cqi`}
                    className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      CQI / Action Taken — {stats.recentCourses[0].code}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                  </Link>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-gray-400">
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Marks
                    </span>
                    <Badge variant="default">Select a course first</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-gray-400">
                    <span className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      View Attainment
                    </span>
                    <Badge variant="default">Select a course first</Badge>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-sm text-gray-400 py-4 text-center">Loading…</div>
            ) : stats && stats.recentCourses.length > 0 ? (
              <div className="space-y-2">
                {stats.recentCourses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/teacher/courses/${course.id}`}
                    className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <span className="font-medium text-gray-900">{course.code}</span>
                      <span className="ml-2 text-gray-500">{course.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{course.semesterName}</span>
                      {course.locked && (
                        <Badge variant="warning">Locked</Badge>
                      )}
                      <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <AlertCircle className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No courses assigned yet.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Courses will appear here once an administrator assigns them.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profile card */}
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 border border-gray-200 text-lg font-semibold text-gray-600">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="success" dot>Teacher</Badge>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex gap-2">
              <Link href="/profile" className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Edit Profile
              </Link>
              <Link href="/change-password" className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Change Password
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
