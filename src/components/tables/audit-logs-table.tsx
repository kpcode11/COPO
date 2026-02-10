'use client'
import React from 'react'
import DataTable from './data-table'

export default function AuditLogsTable({ rows }: { rows: Array<any> }) {
  const columns = [
    { key: 'action', label: 'Action' },
    { key: 'entity', label: 'Entity' },
    { key: 'entityId', label: 'Entity ID' },
    { key: 'userId', label: 'User', render: (r: any) => r.user?.name || r.userId || '—' },
    { key: 'details', label: 'Details' },
    { key: 'createdAt', label: 'When', render: (r: any) => new Date(r.createdAt).toLocaleString() }
  ]
  return <DataTable columns={columns} rows={rows} />
}
