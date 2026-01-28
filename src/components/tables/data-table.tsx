'use client'
import React from 'react'

type Column<T> = { key: string; label: string; render?: (row: T) => React.ReactNode }

export default function DataTable<T>({ columns, rows }: { columns: Column<T>[]; rows: T[] }) {
  return (
    <div className="overflow-auto bg-white rounded shadow-sm">
      <table className="min-w-full divide-y">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="px-4 py-6 text-center text-gray-500">No data</td></tr>
          )}
          {rows.map((row, idx) => (
            <tr key={(row as any).id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 text-sm text-gray-700">{c.render ? c.render(row) : (row as any)[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
