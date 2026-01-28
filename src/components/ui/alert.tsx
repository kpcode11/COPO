'use client'
import React from 'react'

export default function Alert({ type = 'info', children }: { type?: 'info' | 'success' | 'error'; children: React.ReactNode }) {
  const classes = {
    info: 'bg-blue-50 text-blue-800 border border-blue-100',
    success: 'bg-green-50 text-green-800 border border-green-100',
    error: 'bg-red-50 text-red-800 border border-red-100',
  }

  return (
    <div className={`p-3 rounded ${classes[type]}`} role="alert">
      {children}
    </div>
  )
}
