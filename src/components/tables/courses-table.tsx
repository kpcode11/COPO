'use client'
import React from 'react'
import DataTable from './data-table'

export default function CoursesTable({ courses }: { courses: Array<any> }) {
  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'credits', label: 'Credits' }
  ]

  return <DataTable columns={columns} rows={courses} />
}
