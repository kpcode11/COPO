import React from 'react'

export default function Footer() {
  return (
    <footer className="border-t mt-8 py-4 text-center text-sm text-gray-500">
      <div>© {new Date().getFullYear()} COPO — Course Outcome & PO Attainment</div>
    </footer>
  )
}
