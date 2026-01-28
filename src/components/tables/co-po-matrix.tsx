'use client'
import React from 'react'

export default function CoPoMatrix({ matrix }: { matrix: { co: string; poContributions: number[] }[] }) {
  const maxPO = matrix[0]?.poContributions?.length ?? 0
  return (
    <div className="overflow-auto bg-white rounded shadow-sm">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="px-4 py-2">CO</th>
            {Array.from({ length: maxPO }).map((_, i) => <th key={i} className="px-4 py-2">PO{i + 1}</th>)}
          </tr>
        </thead>
        <tbody>
          {matrix.map((r, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-4 py-2">{r.co}</td>
              {r.poContributions.map((c, j) => (
                <td key={j} className="px-4 py-2 text-center">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
