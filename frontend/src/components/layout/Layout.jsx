import { useState, useEffect } from 'react'
import { Outlet, NavLink, useParams, useLocation } from 'react-router-dom'
import { useProjects } from '../../hooks/useProjects'
import Breadcrumb from '../common/Breadcrumb'

// ---------------------------------------------------------------------------
// Dark mode hook — persists preference in localStorage
// ---------------------------------------------------------------------------
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('darkMode', dark)
  }, [dark])

  return [dark, setDark]
}

// ---------------------------------------------------------------------------
// Nav item with active highlighting
// ---------------------------------------------------------------------------
function NavItem({ to, children, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-indigo-700 text-white'
            : 'text-indigo-100 hover:bg-indigo-700/60 hover:text-white'
        }`
      }
    >
      {children}
    </NavLink>
  )
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------
function Sidebar({ isOpen, onClose }) {
  const { projects } = useProjects()
  const { slug } = useParams()

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-indigo-900 z-30 flex flex-col
          transform transition-transform duration-200 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="px-5 py-4 border-b border-indigo-800 flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-500 rounded-md flex items-center justify-center text-white font-bold text-sm">R</div>
          <span className="text-white text-base font-bold tracking-wide">Report Dashboard</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 pb-1 text-xs font-semibold text-indigo-400 uppercase tracking-wider">Projects</p>
          <NavItem to="/projects" end>All Projects</NavItem>

          {/* Per-project sub-nav — shown when on a project route */}
          {slug && (
            <div className="mt-3 space-y-0.5">
              <p className="px-3 pb-1 text-xs font-semibold text-indigo-400 uppercase tracking-wider truncate">
                {projects.find((p) => p.slug === slug)?.name || slug}
              </p>
              <NavItem to={`/projects/${slug}`} end>Latest Run</NavItem>
              <NavItem to={`/projects/${slug}/history`}>Run History</NavItem>
              <NavItem to={`/projects/${slug}/trends`}>Trends</NavItem>
              <NavItem to={`/projects/${slug}/upload`}>Upload</NavItem>
              <NavItem to={`/projects/${slug}/docs`}>API Docs</NavItem>
              <NavItem to={`/projects/${slug}/settings`}>Settings</NavItem>
            </div>
          )}
        </nav>

        <div className="px-4 py-3 border-t border-indigo-800">
          <p className="text-xs text-indigo-400">Playwright Test Dashboard</p>
        </div>
      </aside>
    </>
  )
}

// ---------------------------------------------------------------------------
// Breadcrumb builder
// ---------------------------------------------------------------------------
function useBreadcrumbs() {
  const { slug, number } = useParams()
  const location = useLocation()
  const crumbs = [{ label: 'Projects', to: '/projects' }]

  if (slug) {
    crumbs.push({ label: slug, to: `/projects/${slug}` })
    if (location.pathname.includes('/history'))   crumbs.push({ label: 'History' })
    else if (location.pathname.includes('/trends'))   crumbs.push({ label: 'Trends' })
    else if (location.pathname.includes('/upload'))   crumbs.push({ label: 'Upload' })
    else if (location.pathname.includes('/settings')) crumbs.push({ label: 'Settings' })
    else if (location.pathname.includes('/docs'))     crumbs.push({ label: 'API Docs' })
    else if (number) crumbs.push({ label: `Run #${number}` })
  }

  return crumbs
}

// ---------------------------------------------------------------------------
// Topbar
// ---------------------------------------------------------------------------
function Topbar({ onMenuClick, dark, onDarkToggle }) {
  const crumbs = useBreadcrumbs()

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-4 flex-shrink-0">
      <button
        className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <Breadcrumb items={crumbs} />
      <div className="flex-1" />

      {/* Dark mode toggle */}
      <button
        onClick={() => onDarkToggle(!dark)}
        className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {dark ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------
export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dark, setDark] = useDarkMode()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          dark={dark}
          onDarkToggle={setDark}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
