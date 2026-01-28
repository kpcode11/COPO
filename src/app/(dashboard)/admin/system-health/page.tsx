'use client'
import React, { useEffect, useState } from 'react'
import Alert from '@/components/ui/alert'

export default function SystemHealthPage() {
  const [health, setHealth] = useState<any>(null)
  const [version, setVersion] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [hRes, vRes] = await Promise.all([fetch('/api/health'), fetch('/api/version')])
        const h = await hRes.json()
        const v = await vRes.json()
        if (!mounted) return
        setHealth(h)
        setVersion(v)
      } catch (err: any) {
        setError(err.message || 'Failed to load system status')
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">System health</h1>
        <div className="text-sm text-gray-500">Status and versions</div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {health ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 border rounded">
            <div className="text-sm text-gray-500">Health</div>
            <div className={`mt-2 font-semibold ${health.status === 'ok' ? 'text-green-700' : 'text-red-700'}`}>{health.status}</div>
            <div className="text-xs text-gray-400 mt-1">Uptime: {Math.round(health.uptime ?? 0)}s</div>
          </div>

          <div className="bg-white p-4 border rounded">
            <div className="text-sm text-gray-500">Versions</div>
            <div className="mt-2">App: {version?.appVersion ?? '—'}</div>
            <div>Prisma: {version?.prismaVersion ?? '—'}</div>
            <div className="text-xs text-gray-400 mt-1">DB time: {version?.dbTime ?? '—'}</div>
          </div>
        </div>
      ) : (
        <div>Loading…</div>
      )}
    </div>
  )
}
