'use client'
import React from 'react'

export default function StatsCard({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-white border rounded p-4 shadow-sm min-w-48">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
      {hint && <div className="text-xs text-gray-400 mt-1">{hint}</div>}
    </div>
  )
}
