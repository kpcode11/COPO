'use client'
import React from 'react'
import DataTable from './data-table'

export default function MarksTable({ marks }: { marks: Array<any> }) {
  const columns = [
    { key: 'student', label: 'Student', render: (m: any) => m.studentName || m.student?.name || '-' },
    { key: 'roll', label: 'Roll', render: (m: any) => m.student?.roll || '-' },
    { key: 'marks', label: 'Marks', render: (m: any) => m.marks }
  ]
  return <DataTable columns={columns} rows={marks} />
}
