import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'

export function useAdminFetch<T>(url: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('No session')
        setLoading(false)
        return
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) {
        setError(`Error ${res.status}`)
        setLoading(false)
        return
      }
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
