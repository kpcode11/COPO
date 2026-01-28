'use client'
import React from 'react'
import DataTable from './data-table'

export default function PoAttainmentTable({ rows }: { rows: Array<any> }) {
  const columns = [
    { key: 'po', label: 'PO' },
    { key: 'percent', label: 'Attainment (%)' },
    { key: 'level', label: 'Level' }
  ]
  return <DataTable columns={columns} rows={rows} />
}
