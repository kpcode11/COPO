import React from 'react'
import './globals.css'

export const metadata = {
  title: 'CO-PO Attainment System',
  description: 'NBA-ready CO–PO attainment system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen font-sans">
        {children}
      </body>
    </html>
  )
}
