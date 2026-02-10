'use client'
import React from 'react'
import useSession from '@/hooks/useSession'
import Badge from '@/components/ui/badge'
import Dropdown from '@/components/ui/dropdown'
import { useRouter } from 'next/navigation'
import { User, Settings, KeyRound, LogOut, ChevronDown } from 'lucide-react'

export default function Header() {
  const { user, loading } = useSession()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const roleBadgeVariant =
    user?.role === 'ADMIN' ? 'danger' as const :
    user?.role === 'HOD' ? 'primary' as const : 'success' as const

  const roleLabel =
    user?.role === 'ADMIN' ? 'Administrator' :
    user?.role === 'HOD' ? 'Head of Department' : 'Teacher'

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-medium text-gray-500">
          CO-PO Attainment System
        </h1>
      </div>

      {/* <div className="flex items-center gap-3">
        {loading ? (
          <div className="h-8 w-32 animate-pulse rounded-md bg-gray-100" />
        ) : user ? (
          <>
            <Badge variant={roleBadgeVariant} dot>{roleLabel}</Badge>
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100">
                    <User className="h-3.5 w-3.5 text-gray-600" />
                  </div>
                  <span className="font-medium">{user.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </button>
              }
              items={[
                { label: 'Profile', icon: <User className="h-4 w-4" />, onClick: () => router.push('/profile') },
                { label: 'Change Password', icon: <KeyRound className="h-4 w-4" />, onClick: () => router.push('/change-password') },
                ...(user.role === 'ADMIN' ? [{ label: 'Settings', icon: <Settings className="h-4 w-4" />, onClick: () => router.push('/dashboard/admin/settings') }] : []),
                { label: '', onClick: () => {}, divider: true },
                { label: 'Sign out', icon: <LogOut className="h-4 w-4" />, onClick: handleLogout, danger: true },
              ]}
            />
          </>
        ) : null}
      </div> */}
    </header>
  )
}
