import { useState, useEffect } from 'react'
import { getProject } from '../api/client'

export function useProject(slug) {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    getProject(slug)
      .then(setProject)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug])

  return { project, loading, error }
}
