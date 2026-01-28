import React from 'react'
import Button from '@/components/ui/button'

export default function SessionExpired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white rounded shadow w-full max-w-md text-center">
        <h1 className="text-xl font-semibold mb-4">Session expired</h1>
        <p className="mb-6 text-gray-600">It looks like your session has ended. For security reasons please sign in again to continue.</p>
        <div className="flex justify-center gap-3">
          <a href="/login"><Button variant="primary">Sign in</Button></a>
          <a href="/" className="text-sm text-gray-500 self-center">Back to home</a>
        </div>
      </div>
    </div>
  )
}