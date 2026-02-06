'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/spinner'
import {
  Users,
  BookOpen,
  Building2,
  GraduationCap,
  Shield,
  Activity,
  ScrollText,
  Settings,
  Calendar,
  ArrowRight,
} from 'lucide-react'

interface Stats {
  users: number
  courses: number
  departments: number
  programs: number
}

function QuickLink({ href, icon: Icon, label, description }: {
  href: string
  icon: React.ElementType
  label: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-200 hover:shadow-sm transition-all"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5">{description}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400 mt-0.5 transition-colors" />
    </Link>
  )
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, deptsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/departments'),
        ])
        const usersData = await usersRes.json()
        const deptsData = await deptsRes.json()
        setStats({
          users: usersData.users?.length ?? 0,
          courses: 0,
          departments: deptsData.departments?.length ?? 0,
          programs: 0,
        })
      } catch {
        setStats({ users: 0, courses: 0, departments: 0, programs: 0 })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) return <PageLoader label="Loading dashboard…" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">System overview and quick access to management tools.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{stats?.users ?? '—'}</div>
              <div className="text-xs text-gray-500">Total Users</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{stats?.departments ?? '—'}</div>
              <div className="text-xs text-gray-500">Departments</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <GraduationCap className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{stats?.programs ?? '—'}</div>
              <div className="text-xs text-gray-500">Programs</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
              <BookOpen className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-gray-900">{stats?.courses ?? '—'}</div>
              <div className="text-xs text-gray-500">Courses</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickLink href="/dashboard/admin/users" icon={Users} label="Manage Users" description="Create, edit, and manage user accounts" />
          <QuickLink href="/dashboard/admin/rbac" icon={Shield} label="Roles & Access" description="Configure roles and permissions" />
          <QuickLink href="/dashboard/admin/departments" icon={Building2} label="Departments" description="Manage academic departments" />
          <QuickLink href="/dashboard/admin/academic-years" icon={Calendar} label="Academic Years" description="Configure academic year periods" />
          <QuickLink href="/dashboard/admin/audit-logs" icon={ScrollText} label="Audit Logs" description="View system activity logs" />
          <QuickLink href="/dashboard/admin/settings" icon={Settings} label="System Settings" description="Global configuration and thresholds" />
        </div>
      </div>
    </div>
  )
}
