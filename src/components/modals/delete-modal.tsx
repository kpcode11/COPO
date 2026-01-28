'use client'
import React from 'react'
import ConfirmModal from './confirm-modal'

export default function DeleteModal({ open, name, onConfirm, onCancel }: { open: boolean; name?: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <ConfirmModal open={open} title={`Delete ${name || 'item'}`} onConfirm={onConfirm} onCancel={onCancel}>
      <div className="text-sm">This action will deactivate the item. This cannot be undone.</div>
    </ConfirmModal>
  )
}
