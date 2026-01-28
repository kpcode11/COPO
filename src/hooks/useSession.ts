'use client'
import { useCallback, useEffect, useState } from 'react'

export type User = { id: string; name: string; email: string; role: string; departmentId?: string | null }

export default function useSession() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSession = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/session')
      if (!res.ok) {
        setUser(null)
      } else {
        const data = await res.json()
        setUser(data?.user ?? null)
      }
    } catch (err) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  return { user, loading, refresh: fetchSession }
}
