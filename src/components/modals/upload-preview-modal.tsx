'use client'
import React from 'react'
import Button from '@/components/ui/button'

export default function UploadPreviewModal({ open, rows, onClose }: { open: boolean; rows: any[]; onClose: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded p-6 w-full max-w-2xl">
        <h3 className="text-lg font-semibold mb-4">Upload preview</h3>
        <div className="overflow-auto max-h-80 mb-4">
          <table className="min-w-full">
            <thead>
              <tr>
                {Object.keys(rows[0] || {}).map((k) => <th key={k} className="px-3 py-2 text-left text-xs text-gray-500">{k}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {Object.values(r).map((v, j) => <td key={j} className="px-3 py-2 text-sm">{String(v)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  )
}
