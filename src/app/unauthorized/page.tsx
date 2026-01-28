import React from 'react'
import Button from '@/components/ui/button'

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-8 bg-white rounded shadow w-full max-w-md text-center">
        <h1 className="text-xl font-semibold mb-4">Unauthorized</h1>
        <p className="mb-4 text-gray-600">You do not have permission to view this page. If you believe this is an error, contact your administrator.</p>
        <div className="mt-6 flex justify-center gap-3">
          <a href="/profile"><Button variant="secondary">My profile</Button></a>
          <a href="/" className="self-center text-sm text-gray-500">Back to home</a>
        </div>
      </div>
    </div>
  )
}