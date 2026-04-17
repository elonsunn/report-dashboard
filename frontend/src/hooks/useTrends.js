import { useState, useEffect, useCallback } from 'react'
import { getTrends, getTopFailures, getTopFlaky } from '../api/client'

export function useTrends(slug, limit = 30) {
  const [trends, setTrends]       = useState([])
  const [topFailing, setTopFailing] = useState([])
  const [topFlaky, setTopFlaky]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const load = useCallback(async () => {
    if (!slug) return
    setLoading(true)
    setError(null)
    try {
      const [trendsData, failuresData, flakyData] = await Promise.all([
        getTrends(slug, limit),
        getTopFailures(slug, 10),
        getTopFlaky(slug, 10),
      ])
      setTrends(trendsData.trends || [])
      setTopFailing(failuresData.top_failures || [])
      setTopFlaky(flakyData.top_flaky || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [slug, limit])

  useEffect(() => { load() }, [load])

  return { trends, topFailing, topFlaky, loading, error, reload: load }
}
