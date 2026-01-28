'use client'
import React, { useEffect } from 'react'
import LoginForm from '@/components/forms/LoginForm'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((d) => {
        if (!mounted) return
        if (d?.user) router.replace('/dashboard')
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow w-full max-w-lg">
        <h1 className="text-2xl font-semibold mb-6">Login</h1>
        <LoginForm />
        <div className="mt-4 text-sm">
          <a href="/register" className="text-blue-600">Create an account</a>
        </div>
      </div>
    </div>
  )
} 
