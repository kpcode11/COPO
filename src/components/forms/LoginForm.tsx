'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/input'
import Button from '@/components/ui/button'
import Alert from '@/components/ui/alert'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (!email) return 'Email is required'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Enter a valid email'
    if (!password) return 'Password is required'
    return null
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const clientErr = validate()
    if (clientErr) {
      setError(clientErr)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }
      // On success redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md w-full">
      {error && <Alert type="error">{error}</Alert>}
      <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />
      <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />
      <div className="flex items-center justify-between mt-4">
        <Button type="submit" variant="primary" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</Button>
        <a href="/register" className="text-sm text-blue-600">Create account</a>
      </div>
    </form>
  )
}