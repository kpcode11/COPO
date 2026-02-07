'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function SignOutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const signOut = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={signOut}
      disabled={loading}
      className={
        className ||
        'flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors'
      }
    >
      <LogOut className="h-3.5 w-3.5" />
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
