'use client'
import React, { useEffect, useState } from 'react'
import AuditLogsTable from '@/components/tables/audit-logs-table'
import Alert from '@/components/ui/alert'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function fetchLogs() {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/audit-logs?perPage=100')
        const data = await res.json()
        if (!mounted) return
        setLogs(data.logs || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load audit logs')
      } finally { mounted && setLoading(false) }
    }
    fetchLogs()
    return () => { mounted = false }
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Audit logs</h1>
        <div className="text-sm text-gray-500">Recent actions</div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {loading ? <div>Loading...</div> : <AuditLogsTable rows={logs} />}
    </div>
  )
}
