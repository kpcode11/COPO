'use client'
import React, { useEffect, useState } from 'react'
import StatsCard from '@/components/cards/stats-card'
import AuditLogsTable from '@/components/tables/audit-logs-table'
import Alert from '@/components/ui/alert'

export default function OverviewPage() {
  const [stats, setStats] = useState({ users: 0, courses: 0, uploads: 0 })
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const [usersRes, coursesRes, auditsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/courses'),
          fetch('/api/admin/audit-logs?perPage=5')
        ])

        const usersData = await usersRes.json()
        const coursesData = await coursesRes.json()
        const auditsData = await auditsRes.json()

        if (!mounted) return
        setStats({ users: usersData.users?.length ?? 0, courses: coursesData.courses?.length ?? 0, uploads: 0 })
        setLogs(auditsData.logs ?? [])
      } catch (err: any) {
        setError(err.message || 'Failed to load overview')
      } finally { mounted && setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Overview</h1>
        <div className="text-sm text-gray-500">Summary of system activity</div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard title="Users" value={stats.users} />
        <StatsCard title="Courses" value={stats.courses} />
        <StatsCard title="Recent uploads" value={stats.uploads} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Recent audit events</h2>
        {loading ? <div>Loading...</div> : <AuditLogsTable rows={logs} />}
      </div>
    </div>
  )
}
