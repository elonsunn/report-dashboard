import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProjectListPage      from './pages/ProjectListPage'
import ProjectDetailPage    from './pages/ProjectDetailPage'
import ProjectSettingsPage  from './pages/ProjectSettingsPage'
import UploadPage           from './pages/UploadPage'
import RunDetailPage        from './pages/RunDetailPage'
import RunHistoryPage       from './pages/RunHistoryPage'
import TrendsPage           from './pages/TrendsPage'
import ApiDocsPage          from './pages/ApiDocsPage'

function NotFound() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">404 — Page Not Found</h1>
      <p className="mt-2 text-gray-500">The page you're looking for doesn't exist.</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/projects" replace />} />

          <Route path="projects"                          element={<ProjectListPage />} />
          <Route path="projects/:slug"                    element={<ProjectDetailPage />} />
          <Route path="projects/:slug/settings"           element={<ProjectSettingsPage />} />
          <Route path="projects/:slug/upload"             element={<UploadPage />} />
          <Route path="projects/:slug/history"            element={<RunHistoryPage />} />
          <Route path="projects/:slug/trends"             element={<TrendsPage />} />
          <Route path="projects/:slug/runs/:number"       element={<RunDetailPage />} />
          <Route path="projects/:slug/docs"             element={<ApiDocsPage />} />
          <Route path="docs"                            element={<ApiDocsPage />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
