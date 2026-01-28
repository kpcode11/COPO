'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignOutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const signOut = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      // best-effort: navigate to login after clearing session
      router.push('/login')
    } catch (err) {
      // ignore and redirect anyway
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={signOut} className={className || 'bg-red-600 text-white px-3 py-1 rounded'} disabled={loading}>
      {loading ? 'Signing out...' : 'Sign out'}
    </button>
  )
}
