import { useState, useEffect, useCallback } from 'react'
import { getProjects, createProject as apiCreateProject, deleteProject as apiDeleteProject } from '../api/client'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getProjects()
      setProjects(data.projects || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const createProject = useCallback(async (name, description) => {
    const data = await apiCreateProject(name, description)
    await load()
    return data
  }, [load])

  const removeProject = useCallback(async (slug) => {
    await apiDeleteProject(slug)
    setProjects((prev) => prev.filter((p) => p.slug !== slug))
  }, [])

  return { projects, loading, error, reload: load, createProject, removeProject }
}
