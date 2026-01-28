'use client'
import React from 'react'
import DataTable from './data-table'

export default function CoAttainmentTable({ rows }: { rows: Array<any> }) {
  const columns = [
    { key: 'co', label: 'CO' },
    { key: 'percent', label: 'Attainment (%)' },
    { key: 'level', label: 'Level' }
  ]
  return <DataTable columns={columns} rows={rows} />
}
