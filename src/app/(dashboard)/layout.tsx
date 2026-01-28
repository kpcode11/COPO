import React from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r p-4">Sidebar</aside>
      <div className="flex-1 p-6">{children}</div>
    </div>
  )
}
