import React from 'react'
import Breadcrumb from '@/components/layout/breadcrumb'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { isAdmin } from '@/lib/auth/rbac'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieHeader = cookies().toString()
  const req = new Request('http://localhost', { headers: { cookie: cookieHeader } })
  const user = await getCurrentUser(req)
  if (!user || !isAdmin(user)) redirect('/unauthorized')

  return (
    <div>
      <div className="mb-4">
        <Breadcrumb items={[{ label: 'Admin', href: '/dashboard/admin' }]} />
      </div>
      <div>{children}</div>
    </div>
  )
}
