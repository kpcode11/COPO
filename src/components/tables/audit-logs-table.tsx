'use client'
import React from 'react'
import DataTable from './data-table'

export default function AuditLogsTable({ rows }: { rows: Array<any> }) {
  const columns = [
    { key: 'action', label: 'Action' },
    { key: 'entity', label: 'Entity' },
    { key: 'user', label: 'User' },
    { key: 'createdAt', label: 'When', render: (r: any) => new Date(r.createdAt).toLocaleString() }
  ]
  return <DataTable columns={columns} rows={rows} />
}
