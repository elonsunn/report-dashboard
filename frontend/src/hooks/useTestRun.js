import { useState, useEffect, useCallback } from 'react'
import { getRun, getLatestRun, getTestCases } from '../api/client'

export function useTestRun(slug, runNumber) {
  const [run, setRun] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    const fetch = runNumber === 'latest'
      ? getLatestRun(slug).then((d) => d.run)
      : getRun(slug, runNumber).then((d) => d.run)

    fetch
      .then(setRun)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug, runNumber])

  return { run, loading, error }
}

export function useTestCases(slug, runNumber, filters = {}) {
  const [cases, setCases]   = useState([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  const load = useCallback(async () => {
    if (!slug || !runNumber) return
    setLoading(true)
    try {
      const params = {}
      if (filters.status) params.status = filters.status
      if (filters.search) params.search = filters.search
      const data = await getTestCases(slug, runNumber, params)
      setCases(data.test_cases || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [slug, runNumber, filters.status, filters.search])

  useEffect(() => { load() }, [load])

  return { cases, total, loading, error, reload: load }
}
