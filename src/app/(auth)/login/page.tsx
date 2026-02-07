'use client'
import React, { useEffect } from 'react'
import LoginForm from '@/components/forms/LoginForm'
import { useRouter } from 'next/navigation'
import { getDashboardForRole } from '@/constants/routes'
import { GraduationCap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((d) => {
        if (!mounted) return
        if (d?.user) {
          const url = getDashboardForRole(d.user.role)
          router.replace(url)
        }
      })
      .catch(() => {})
    return () => { mounted = false }
  }, [router])

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-linear-to-br from-blue-600 to-blue-800 text-white flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">COPO</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold leading-tight">
            Course Outcome &<br />Program Outcome<br />Attainment System
          </h1>
          <p className="text-blue-100 text-sm leading-relaxed max-w-sm">
            Streamline CO-PO mapping, attainment calculation, and academic quality improvement across departments.
          </p>
        </div>
        <p className="text-xs text-blue-200">
          &copy; {new Date().getFullYear()} COPO. Institutional use only.
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-semibold text-gray-900">COPO</span>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Sign in to your account</h2>
              <p className="mt-1 text-sm text-gray-500">
                Enter your credentials to access the system.
              </p>
            </div>
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            Contact your administrator if you need an account.
          </p>
        </div>
      </div>
    </div>
  )
} 
