'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import useSession from '@/hooks/useSession'
import { getNavForRole, type NavSection } from './nav-items'
import SignOutButton from '@/components/auth/SignOutButton'
import Badge from '@/components/ui/badge'
import { User, LogOut, ChevronRight, KeyRound } from 'lucide-react'

function RoleBadge({ role }: { role: string }) {
  const variant =
    role === 'ADMIN' ? 'danger' : role === 'HOD' ? 'primary' : 'success'
  const label =
    role === 'ADMIN'
      ? 'Admin'
      : role === 'HOD'
        ? 'HOD'
        : 'Teacher'
  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  )
}

function NavLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string
  icon: React.ElementType
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-50 text-blue-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon
        className={`h-4 w-4 shrink-0 ${
          active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
        }`}
      />
      <span className="truncate">{label}</span>
      {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-blue-400" />}
    </Link>
  )
}

function SidebarSection({ section, pathname }: { section: NavSection; pathname: string }) {
  return (
    <div className="mb-1">
      <div className="px-3 mb-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          {section.title}
        </span>
      </div>
      <nav className="flex flex-col gap-0.5">
        {section.items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' &&
              item.href !== '/hod' &&
              item.href !== '/teacher' &&
              pathname.startsWith(item.href + '/'))
          return (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isActive}
            />
          )
        })}
      </nav>
    </div>
  )
}

export default function Sidebar() {
  const { user, loading } = useSession()
  const pathname = usePathname()

  const sections = user ? getNavForRole(user.role) : []

  return (
    <aside className="flex flex-col w-64 border-r border-gray-200 bg-white min-h-screen">
      {/* Brand */}
      <div className="px-5 py-4 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">
            CO
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-900">COPO</span>
            <span className="block text-[10px] text-gray-400 leading-none">
              Attainment System
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
          </div>
        ) : (
          sections.map((section) => (
            <SidebarSection
              key={section.title}
              section={section}
              pathname={pathname}
            />
          ))
        )}
      </div>

      {/* User section */}
      <div className="border-t border-gray-100 p-3">
        {loading ? (
          <div className="h-12 animate-pulse rounded-md bg-gray-100" />
        ) : user ? (
          <div className="space-y-2">
            {/* User info */}
            <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <div className="flex items-center gap-1.5">
                  <RoleBadge role={user.role} />
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="flex flex-col gap-0.5">
              <Link
                href="/profile"
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors ${
                  pathname === '/profile' ? 'bg-gray-50 text-gray-900' : ''
                }`}
              >
                <User className="h-3.5 w-3.5" />
                Profile
              </Link>
              <Link
                href="/change-password"
                className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors ${
                  pathname === '/change-password' ? 'bg-gray-50 text-gray-900' : ''
                }`}
              >
                <KeyRound className="h-3.5 w-3.5" />
                Change Password
              </Link>
            </div>

            {/* Sign out */}
            <SignOutButton className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors" />
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Sign in
          </Link>
        )}
      </div>
    </aside>
  )
}
