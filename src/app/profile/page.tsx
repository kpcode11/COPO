'use client'
import React, { useEffect, useState } from 'react'
import SignOutButton from '@/components/auth/SignOutButton'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetch('/api/auth/session').then((r) => r.json()).then((d) => { if (mounted) setUser(d.user) }).catch(console.error).finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="p-8">Loading...</div>
  if (!user) return <div className="p-8">Not signed in. <a href="/login" className="text-blue-600">Login</a></div>

  const dashboardPath = user?.role === 'ADMIN' ? '/dashboard/admin' : user?.role === 'HOD' ? '/dashboard/hod' : '/dashboard/teacher'

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-start justify-between">
        <h1 className="text-xl font-semibold mb-4">Profile</h1>
        <SignOutButton />
      </div>
      <div className="mb-2"><strong>Name:</strong> {user.name}</div>
      <div className="mb-2"><strong>Email:</strong> {user.email}</div>
      <div className="mb-2"><strong>Role:</strong> {user.role}</div>
      <div className="mt-4 flex gap-4">
        <a href={dashboardPath} className="text-blue-600">Open Dashboard</a>
        <a href="/change-password" className="text-blue-600">Change password</a>
      </div>
    </div>
  )
} 