'use client'
import React from 'react'
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
} from 'lucide-react'

export default function TeacherDashboard() {
  const { user, loading } = useSession()

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
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">—</div>
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
              <div className="text-2xl font-semibold text-gray-900">—</div>
              <div className="text-xs text-gray-500">CO Attainment</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <ClipboardList className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">—</div>
              <div className="text-xs text-gray-500">Assessments</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick actions and info */}
      <div className="grid grid-cols-2 gap-5">
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
              <div className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Generate Report
                </span>
                <Badge variant="default">Select a course first</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-gray-200 text-lg font-semibold text-gray-600">
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Role</div>
                  <div className="mt-1">
                    <Badge variant="success" dot>Teacher</Badge>
                  </div>
                </div>
                <div className="rounded-md border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="mt-1">
                    <Badge variant="success">Active</Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/profile" className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-center text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Edit Profile
                </Link>
                <Link href="/change-password" className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-center text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Change Password
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
