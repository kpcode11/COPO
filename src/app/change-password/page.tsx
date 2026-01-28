'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSession from '@/hooks/useSession'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import Alert from '@/components/ui/alert'

export default function ChangePasswordPage() {
  const { user, loading } = useSession()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  if (loading) return <div className="p-8">Loading...</div>
  if (!user) {
    router.replace('/session-expired')
    return null
  }

  const validate = () => {
    if (!currentPassword) return 'Current password is required'
    if (!newPassword || newPassword.length < 6) return 'New password should be at least 6 characters'
    if (newPassword !== confirm) return 'Passwords do not match'
    return null
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const clientErr = validate()
    if (clientErr) return setError(clientErr)

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

  return (
    <div className="p-8 max-w-md">
      <h1 className="text-xl font-semibold mb-4">Change password</h1>
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}
      <form onSubmit={submit}>
        <Input label="Current password" type="password" value={currentPassword} onChange={setCurrentPassword} required />
        <Input label="New password" type="password" value={newPassword} onChange={setNewPassword} required />
        <Input label="Confirm new password" type="password" value={confirm} onChange={setConfirm} required />
        <div className="mt-4">
          <Button type="submit" variant="primary">Change password</Button>
        </div>
      </form>
    </div>
  )
}