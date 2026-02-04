'use client'
import React, { useEffect, useState } from 'react'
import AuditLogsTable from '@/components/tables/audit-logs-table'
import Alert from '@/components/ui/alert'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'

type FilterState = {
  entity?: string
  action?: string
  userId?: string
  since?: string
  until?: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<FilterState>({})
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [total, setTotal] = useState(0)

  const buildQuery = () => {
    const params = new URLSearchParams()
    if (filters.entity) params.append('entity', filters.entity)
    if (filters.action) params.append('action', filters.action)
    if (filters.userId) params.append('userId', filters.userId)
    if (filters.since) params.append('since', filters.since)
    if (filters.until) params.append('until', filters.until)
    params.append('page', String(page))
    params.append('perPage', String(perPage))
    return params.toString()
  }

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const q = buildQuery()
      const res = await fetch(`/api/admin/audit-logs?${q}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch audit logs')
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchLogs() }, [page, perPage])

  const exportCSV = () => {
    if (!logs || logs.length === 0) return
    const header = ['action', 'entity', 'entityId', 'userId', 'details', 'createdAt']
    const rows = logs.map((r) => header.map((h) => JSON.stringify((r as any)[h] ?? '')))
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-page-${page}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Audit logs</h1>
        <div className="text-sm text-gray-500">Recent actions</div>
      </div>

      <div className="bg-white p-4 rounded mb-4">
        <div className="grid grid-cols-3 gap-3">
          <Input label="Entity" value={filters.entity ?? ''} onChange={(v) => setFilters((s) => ({ ...s, entity: v }))} />
          <Input label="Action" value={filters.action ?? ''} onChange={(v) => setFilters((s) => ({ ...s, action: v }))} />
          <Input label="User ID" value={filters.userId ?? ''} onChange={(v) => setFilters((s) => ({ ...s, userId: v }))} />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <label className="text-sm">Since</label>
          <input type="date" className="border p-2 rounded" value={filters.since ?? ''} onChange={(e) => setFilters((s) => ({ ...s, since: e.target.value }))} />
          <label className="text-sm">Until</label>
          <input type="date" className="border p-2 rounded" value={filters.until ?? ''} onChange={(e) => setFilters((s) => ({ ...s, until: e.target.value }))} />
          <Button variant="secondary" onClick={() => { setPage(1); fetchLogs() }}>Search</Button>
          <Button variant="outline" onClick={() => { setFilters({}); setPage(1); setPerPage(50); fetchLogs() }}>Reset</Button>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="secondary" onClick={() => fetchLogs()}>Refresh</Button>
            <Button variant="primary" onClick={() => exportCSV()}>Export CSV</Button>
          </div>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? <div>Loading...</div> : <div>
        <AuditLogsTable rows={logs} />

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Total: {total}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
            <div>Page {page}</div>
            <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={(page * perPage) >= total}>Next</Button>
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1) }} className="border p-2 rounded">
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

      </div>}
    </div>
  )
}
