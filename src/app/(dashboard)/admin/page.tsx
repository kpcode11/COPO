'use client'
import React from 'react'
import Link from 'next/link'
import StatsCard from '@/components/cards/stats-card'

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <div className="text-sm text-gray-500">Global overview</div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatsCard title="Users" value="—" hint="Total users" />
        <StatsCard title="Courses" value="—" hint="Total courses" />
        <StatsCard title="Recent uploads" value="—" hint="Last 7 days" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Link href="/dashboard/admin/overview" className="block p-4 bg-white border rounded hover:shadow">Overview</Link>
        <Link href="/dashboard/admin/system-health" className="block p-4 bg-white border rounded hover:shadow">System health</Link>
        <Link href="/dashboard/admin/audit-logs" className="block p-4 bg-white border rounded hover:shadow">Audit logs</Link>
      </div>
    </div>
  )
}
