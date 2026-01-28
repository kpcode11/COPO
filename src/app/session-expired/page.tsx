import React from 'react'

export default function SessionExpired() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-8 bg-white rounded shadow">
        <h1 className="text-xl font-semibold mb-4">Session expired</h1>
        <p className="mb-4">Your session has expired. Please <a href="/login" className="text-blue-600">login</a> again.</p>
      </div>
    </div>
  )
}