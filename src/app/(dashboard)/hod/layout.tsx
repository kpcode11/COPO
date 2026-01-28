import React from 'react'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { isHod } from '@/lib/auth/rbac'
import { redirect } from 'next/navigation'

export default async function HodLayout({ children }: { children: React.ReactNode }) {
  const cookieHeader = cookies().toString()
  const req = new Request('http://localhost', { headers: { cookie: cookieHeader } })
  const user = await getCurrentUser(req)
  if (!user || !isHod(user)) redirect('/unauthorized')

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-sm text-gray-500">HOD Dashboard</h2>
      </div>
      <div>{children}</div>
    </div>
  )
}