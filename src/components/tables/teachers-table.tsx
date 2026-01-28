'use client'
import React from 'react'
import DataTable from './data-table'

export default function TeachersTable({ teachers, onEdit, onDelete }: { teachers: Array<any>; onEdit?: (u: any) => void; onDelete?: (id: string) => void }) {
  const roleBadge = (r: string) => {
    const classes = {
      ADMIN: 'bg-purple-600 text-white',
      HOD: 'bg-indigo-600 text-white',
      TEACHER: 'bg-green-600 text-white',
    }
    return <span className={`inline-block text-xs px-2 py-1 rounded ${(classes as any)[r as keyof typeof classes] || 'bg-gray-500 text-white'}`}>{r}</span>
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'department', label: 'Department', render: (t: any) => t.department?.name || '-' },
    { key: 'role', label: 'Role', render: (t: any) => roleBadge(t.role) },
    { key: 'actions', label: 'Actions', render: (t: any) => (
      <div className="flex gap-2">
        <button className="px-2 py-1 text-sm bg-blue-600 text-white rounded" onClick={() => onEdit && onEdit(t)}>Edit</button>
        <button className="px-2 py-1 text-sm bg-red-600 text-white rounded" onClick={() => onDelete && onDelete(t.id)}>Deactivate</button>
      </div>
    ) }
  ]

  return <DataTable columns={columns} rows={teachers} />
}
