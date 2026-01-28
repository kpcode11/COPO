'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import Alert from '@/components/ui/alert'

export default function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed')
        setLoading(false)
        return
      }
      setSuccess(data.message || 'Registration successful')
      setTimeout(() => router.push('/login'), 1500)
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md w-full">
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}
      <Input label="Name" value={name} onChange={setName} placeholder="Your full name" required />
      <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
      <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" required />
      <div className="mt-4">
        <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Registering...' : 'Register'}</Button>
      </div>
    </form>
  )
}