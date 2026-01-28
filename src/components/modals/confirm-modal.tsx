'use client'
import React from 'react'
import Button from '@/components/ui/button'

export default function ConfirmModal({ open, title, children, onConfirm, onCancel }: { open: boolean; title?: string; children?: React.ReactNode; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded p-6 w-full max-w-md">
        {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
        <div className="text-sm text-gray-700 mb-4">{children}</div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </div>
  )
}
