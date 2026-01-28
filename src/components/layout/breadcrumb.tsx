import React from 'react'
import Link from 'next/link'

export default function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm mb-4">
      <ol className="flex items-center gap-2 text-gray-500">
        {items.map((it, i) => (
          <li key={i} className={i === items.length - 1 ? 'text-gray-700 font-medium' : ''}>
            {it.href ? <Link href={it.href} className="hover:underline">{it.label}</Link> : <span>{it.label}</span>}
            {i < items.length - 1 && <span className="mx-2">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
