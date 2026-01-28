'use client'
import React from 'react'
import DataTable from './data-table'

export default function TeachersTable({ teachers, onEdit, onDelete }: { teachers: Array<any>; onEdit?: (u: any) => void; onDelete?: (id: string) => void }) {
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'department', label: 'Department', render: (t: any) => t.department?.name || '-' },
    { key: 'role', label: 'Role' },
    { key: 'actions', label: 'Actions', render: (t: any) => (
      <div className="flex gap-2">
        <button className="px-2 py-1 text-sm bg-blue-600 text-white rounded" onClick={() => onEdit && onEdit(t)}>Edit</button>
        <button className="px-2 py-1 text-sm bg-red-600 text-white rounded" onClick={() => onDelete && onDelete(t.id)}>Delete</button>
      </div>
    ) }
  ]

  return <DataTable columns={columns} rows={teachers} />
}
