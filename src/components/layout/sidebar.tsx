'use client'
import React from 'react'
import Link from 'next/link'
import useSession from '@/hooks/useSession'
import SignOutButton from '@/components/auth/SignOutButton'

export default function Sidebar() {
  const { user, loading } = useSession()

  const common = [
    { label: 'Profile', href: '/profile' },
    { label: 'Change password', href: '/change-password' }
  ]

  const adminLinks = [
    { label: 'Admin dashboard', href: '/dashboard/admin' },
    { label: 'Users', href: '/dashboard/admin/users' },
    { label: 'Settings', href: '/dashboard/admin/settings' }
  ]

  const hodLinks = [
    { label: 'HOD dashboard', href: '/dashboard/hod' },
    { label: 'Department reports', href: '/dashboard/hod/reports' }
  ]

  const teacherLinks = [
    { label: 'My courses', href: '/dashboard/teacher/courses' },
    { label: 'My reports', href: '/dashboard/teacher/reports' }
  ]

  return (
    <aside className="w-64 border-r bg-white min-h-screen p-4">
      <div className="mb-6">
        <div className="text-sm text-gray-500">User</div>
        <div className="font-medium">{loading ? 'Loading…' : (user ? user.name : 'Guest')}</div>
        <div className="text-xs text-gray-400">{user?.email}</div>
      </div>

      <nav className="flex flex-col gap-2">
        {common.map((it) => (
          <Link key={it.href} href={it.href} className="text-sm text-gray-700 hover:text-blue-600">{it.label}</Link>
        ))}

        {user?.role === 'ADMIN' && (
          <div className="mt-4">
            <div className="text-xs text-gray-400 uppercase mb-2">Admin</div>
            {adminLinks.map((it) => <Link key={it.href} href={it.href} className="block text-sm text-gray-700 hover:text-blue-600">{it.label}</Link>)}
          </div>
        )}

        {user?.role === 'HOD' && (
          <div className="mt-4">
            <div className="text-xs text-gray-400 uppercase mb-2">HOD</div>
            {hodLinks.map((it) => <Link key={it.href} href={it.href} className="block text-sm text-gray-700 hover:text-blue-600">{it.label}</Link>)}
          </div>
        )}

        {user?.role === 'TEACHER' && (
          <div className="mt-4">
            <div className="text-xs text-gray-400 uppercase mb-2">Teacher</div>
            {teacherLinks.map((it) => <Link key={it.href} href={it.href} className="block text-sm text-gray-700 hover:text-blue-600">{it.label}</Link>)}
          </div>
        )}
      </nav>

      <div className="mt-6">
        {user ? <SignOutButton /> : <Link href="/login" className="text-sm text-blue-600">Sign in</Link>}
      </div>
    </aside>
  )
}
