'use client'
import React, { useEffect, useState } from 'react'
import DataTable from '@/components/tables/data-table'
import Alert from '@/components/ui/alert'

export default function HodDashboard() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (res.ok && data.users) setUsers(data.users)
      else setError(data.error || 'Failed to load users')
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'createdAt', label: 'Created', render: (r: any) => new Date(r.createdAt).toLocaleDateString() }
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">HOD Dashboard</h1>
        <div className="text-sm text-gray-500">Department view</div>
      </div>
      {error && <Alert type="error">{error}</Alert>}
      {loading ? <div>Loading...</div> : <DataTable columns={columns} rows={users} />}
    </div>
  )
}
