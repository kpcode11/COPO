import React from 'react'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { hasMinRole } from '@/lib/auth/rbac'
import { redirect } from 'next/navigation'

export default async function HodLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()
  const req = new Request('http://localhost', { headers: { cookie: cookieHeader } })
  const user = await getCurrentUser(req)
  if (!user || !hasMinRole(user, 'HOD')) redirect('/unauthorized')

  return <div>{children}</div>
}