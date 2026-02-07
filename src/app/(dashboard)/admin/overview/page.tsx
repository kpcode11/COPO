'use client'
import React, { useEffect, useState } from 'react'
import StatsCard from '@/components/cards/stats-card'
import AuditLogsTable from '@/components/tables/audit-logs-table'
import Alert from '@/components/ui/alert'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/spinner'
import { LayoutDashboard, Users, BookOpen, Building2, GraduationCap, Calendar, ClipboardList, Target } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  users: number
  courses: number
  departments: number
  programs: number
  academicYears: number
  semesters: number
  teachers: number
  surveyTemplates: number
}

export default function OverviewPage() {
  const [stats, setStats] = useState<DashboardStats>({
    users: 0, courses: 0, departments: 0, programs: 0,
    academicYears: 0, semesters: 0, teachers: 0, surveyTemplates: 0,
  })
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const [usersRes, coursesRes, deptsRes, progsRes, aysRes, semsRes, teachersRes, surveysRes, auditsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/admin/courses'),
          fetch('/api/admin/departments'),
          fetch('/api/admin/programs'),
          fetch('/api/admin/academic-years'),
          fetch('/api/admin/semesters'),
          fetch('/api/admin/teachers'),
          fetch('/api/admin/surveys'),
          fetch('/api/admin/audit-logs?perPage=8'),
        ])

        const usersData = await usersRes.json()
        const coursesData = await coursesRes.json()
        const deptsData = await deptsRes.json()
        const progsData = await progsRes.json()
        const aysData = await aysRes.json()
        const semsData = await semsRes.json()
        const teachersData = await teachersRes.json()
        const surveysData = await surveysRes.json()
        const auditsData = await auditsRes.json()

        if (!mounted) return
        setStats({
          users: usersData.users?.length ?? 0,
          courses: coursesData.courses?.length ?? 0,
          departments: deptsData.departments?.length ?? 0,
          programs: progsData.programs?.length ?? 0,
          academicYears: aysData.academicYears?.length ?? 0,
          semesters: semsData.semesters?.length ?? 0,
          teachers: teachersData.teachers?.length ?? 0,
          surveyTemplates: surveysData.stats?.total ?? 0,
        })
        setLogs(auditsData.logs ?? [])
      } catch (err: any) {
        setError(err.message || 'Failed to load overview')
      } finally { mounted && setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [])

  if (loading) return <PageLoader />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-gray-400" />
          <div>
            <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">System overview and quick links</p>
          </div>
        </div>
      </div>

      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Link href="/admin/users">
          <StatsCard title="Users" value={stats.users} hint="Total registered users" />
        </Link>
        <Link href="/admin/teachers">
          <StatsCard title="Teachers" value={stats.teachers} hint="Active teachers" />
        </Link>
        <Link href="/admin/courses">
          <StatsCard title="Courses" value={stats.courses} hint="All courses" />
        </Link>
        <Link href="/admin/departments">
          <StatsCard title="Departments" value={stats.departments} hint="Academic departments" />
        </Link>
        <Link href="/admin/programs">
          <StatsCard title="Programs" value={stats.programs} hint="Degree programs" />
        </Link>
        <Link href="/admin/academic-years">
          <StatsCard title="Academic Years" value={stats.academicYears} hint="Configured years" />
        </Link>
        <Link href="/admin/semesters">
          <StatsCard title="Semesters" value={stats.semesters} hint="All semesters" />
        </Link>
        <Link href="/admin/surveys">
          <StatsCard title="Survey Templates" value={stats.surveyTemplates} hint="Course + Program" />
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link href="/admin/attainment">
          <Card className="hover:border-blue-300 transition-colors cursor-pointer">
            <CardContent>
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">View Attainment</p>
                  <p className="text-xs text-gray-500">CO & PO attainment data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/reports">
          <Card className="hover:border-blue-300 transition-colors cursor-pointer">
            <CardContent>
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium">Generate Reports</p>
                  <p className="text-xs text-gray-500">Course, program & department reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/settings">
          <Card className="hover:border-blue-300 transition-colors cursor-pointer">
            <CardContent>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium">System Settings</p>
                  <p className="text-xs text-gray-500">Thresholds & weightages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Audit Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/admin/audit-logs" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No recent activity</p>
          ) : (
            <AuditLogsTable rows={logs} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
