/**
 * Axios API client — all requests to the Django backend go through here.
 * Base URL is /api/v1 (proxied to http://localhost:8000 in development).
 */

import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Response interceptor — unwrap data, normalize errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Unknown error'
    return Promise.reject(new Error(message))
  }
)

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export const getProjects = () => api.get('/projects/')

export const createProject = (name, description = '') =>
  api.post('/projects/', { name, description })

export const getProject = (slug) => api.get(`/projects/${slug}/`)

export const updateProject = (slug, data) => api.put(`/projects/${slug}/`, data)

export const deleteProject = (slug) => api.delete(`/projects/${slug}/`)

export const generateApiKey = (slug) => api.post(`/projects/${slug}/api-key/`)

export const triggerJenkins = (slug) => api.post(`/projects/${slug}/trigger/`)

// ---------------------------------------------------------------------------
// Test Runs
// ---------------------------------------------------------------------------

export const getRuns = (slug, page = 1, perPage = 20) =>
  api.get(`/projects/${slug}/runs/`, { params: { page, per_page: perPage } })

export const getLatestRun = (slug) => api.get(`/projects/${slug}/runs/latest/`)

export const getRun = (slug, runNumber) =>
  api.get(`/projects/${slug}/runs/${runNumber}/`)

export const deleteRun = (slug, runNumber) =>
  api.delete(`/projects/${slug}/runs/${runNumber}/`)

export const uploadReport = (slug, apiKey, jsonData) =>
  api.post(`/projects/${slug}/runs/`, jsonData, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
  })

export const uploadReportFile = (slug, file) => {
  const formData = new FormData()
  formData.append('file', file)
  // No API key needed — the web upload endpoint is unauthenticated
  return api.post(`/projects/${slug}/upload/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// ---------------------------------------------------------------------------
// Test Cases
// ---------------------------------------------------------------------------

export const getTestCases = (slug, runNumber, params = {}) =>
  api.get(`/projects/${slug}/runs/${runNumber}/cases/`, { params })

export const getTestCase = (id) => api.get(`/test-cases/${id}/`)

// ---------------------------------------------------------------------------
// Trends & Stats
// ---------------------------------------------------------------------------

export const getTrends = (slug, limit = 30) =>
  api.get(`/projects/${slug}/trends/`, { params: { limit } })

export const getStats = (slug) => api.get(`/projects/${slug}/stats/`)

export const getTopFailures = (slug, limit = 10) =>
  api.get(`/projects/${slug}/top-failures/`, { params: { limit } })

export const getTopFlaky = (slug, limit = 10) =>
  api.get(`/projects/${slug}/top-flaky/`, { params: { limit } })
