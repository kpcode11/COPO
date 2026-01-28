'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ChangePasswordPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    fetch('/api/auth/session').then((r) => r.json()).then((d) => { if (mounted) setUser(d.user) }).catch(console.error).finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!user) return setError('Not signed in')
    if (newPassword !== confirm) return setError('Passwords do not match')

    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Failed to change password')
      setSuccess('Password changed successfully')
      setTimeout(() => router.push('/profile'), 1000)
    } catch (err: any) {
      setError(err.message || 'Network error')
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (!user) return <div className="p-8">Not signed in. <a href="/login" className="text-blue-600">Login</a></div>

  return (
    <div className="p-8 max-w-md">
      <h1 className="text-xl font-semibold mb-4">Change password</h1>
      <form onSubmit={submit}>
        <div className="mb-3">
          <label className="block text-sm mb-1">Current password</label>
          <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full border rounded px-3 py-2" required />
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">New password</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border rounded px-3 py-2" required />
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">Confirm new password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full border rounded px-3 py-2" required />
        </div>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Change password</button>
      </form>
    </div>
  )
}