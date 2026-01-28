'use client'
import React, { useEffect, useState } from 'react'
import Alert from '@/components/ui/alert'

export default function TeacherDashboard() {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openRequest, setOpenRequest] = useState(false)
  const [reason, setReason] = useState('')

  useEffect(() => {
    fetch('/api/auth/session').then((r) => r.json()).then((d) => setUser(d.user)).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  const sendRequest = async () => {
    try {
      const res = await fetch('/api/rbac/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestedRole: 'HOD', reason }) })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Request failed')
      setOpenRequest(false)
      setReason('')
      alert('Request submitted')
    } catch (err: any) { setError(err.message || 'Network error') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Teacher Dashboard</h1>
        <div className="text-sm text-gray-500">Self-service</div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? <div>Loading...</div> : (
        <div>
          <div className="mb-2"><strong>Name:</strong> {user?.name}</div>
          <div className="mb-2"><strong>Email:</strong> {user?.email}</div>
          <div className="mb-2"><strong>Role:</strong> {user?.role}</div>
          <div className="mt-4">
            <button className="px-3 py-1 bg-yellow-500 text-white rounded" onClick={() => setOpenRequest(true)}>Request Role Change</button>
          </div>

          {openRequest && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <div className="bg-white p-6 rounded w-full max-w-md">
                <h3 className="text-lg mb-3">Request Role Change</h3>
                <label className="block text-sm mb-1">Reason</label>
                <textarea className="w-full border rounded p-2" value={reason} onChange={(e) => setReason(e.target.value)} />
                <div className="mt-4 flex justify-end gap-2">
                  <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => setOpenRequest(false)}>Cancel</button>
                  <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => sendRequest()}>Send</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
