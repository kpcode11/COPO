'use client'
import React from 'react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
}

export default function Spinner({ size = 'md', className = '', label }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`} role="status">
      <div className={`${sizeMap[size]} rounded-full border-gray-200 border-t-blue-600 animate-spin`} />
      {label && <span className="text-sm text-gray-500">{label}</span>}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function PageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center min-h-50">
      <Spinner size="lg" label={label} />
    </div>
  )
}
