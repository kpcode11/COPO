import React from 'react'
import './globals.css'

export const metadata = {
  title: 'CO-PO Attainment System',
  description: 'NBA-ready CO–PO attainment system',
}

import Footer from '@/components/layout/footer'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen font-sans flex flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  )
}
