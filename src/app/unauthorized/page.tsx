import React from 'react'

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-8 bg-white rounded shadow">
        <h1 className="text-xl font-semibold mb-4">Unauthorized</h1>
        <p className="mb-4">You do not have permission to view this page. If you believe this is an error, contact your administrator.</p>
      </div>
    </div>
  )
}