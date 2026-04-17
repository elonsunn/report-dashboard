import { useParams } from 'react-router-dom'
import { useState } from 'react'

function CodeBlock({ code, language = 'bash' }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">
        {title}
      </h2>
      {children}
    </section>
  )
}

function EndpointRow({ method, path, description }) {
  const colors = {
    GET:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    POST:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    PUT:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
      <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-mono font-bold ${colors[method]}`}>{method}</span>
      <code className="flex-shrink-0 text-xs font-mono text-gray-700 dark:text-gray-300">{path}</code>
      <span className="text-xs text-gray-500 dark:text-gray-400">{description}</span>
    </div>
  )
}

export default function ApiDocsPage() {
  const { slug } = useParams()
  const projectSlug = slug || 'your-project-slug'
  const baseUrl = window.location.origin

  const curlExample = `curl -X POST ${baseUrl}/api/v1/projects/${projectSlug}/runs/ \\
  -H "Authorization: Bearer rpt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d @results.json`

  const jenkinsfile = `pipeline {
  agent any
  stages {
    stage('Test') {
      steps {
        sh 'npx playwright test --reporter=json'
      }
    }
  }
  post {
    always {
      sh """
        curl -X POST \${REPORT_DASHBOARD_URL}/api/v1/projects/\${PROJECT_SLUG}/runs/ \\
          -H "Authorization: Bearer \${REPORT_API_KEY}" \\
          -H "Content-Type: application/json" \\
          -d @playwright-report/results.json
      """
    }
  }
}`

  const playwrightConfig = `// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  reporter: [
    ['html'],                               // local HTML report
    ['json', { outputFile: 'results.json' }] // JSON for dashboard upload
  ],
})`

  const uploadResponse = `{
  "run_id": "6614abc123def456",
  "run_number": 42,
  "summary": {
    "total": 17,
    "passed": 16,
    "failed": 1,
    "flaky": 0,
    "skipped": 0,
    "pass_rate": 94.12
  },
  "url": "/projects/${projectSlug}/runs/42/"
}`

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">API Documentation</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Integrate this dashboard with your CI/CD pipeline to automatically upload Playwright reports.
        </p>
      </div>

      <Section title="Authentication">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          All upload endpoints require an API key. Generate one in{' '}
          {slug ? (
            <a href={`/projects/${slug}/settings`} className="text-indigo-600 dark:text-indigo-400 underline">
              Project Settings
            </a>
          ) : 'Project Settings'}.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">Send the key in one of these headers:</p>
        <CodeBlock code={`Authorization: Bearer rpt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n# or\nX-API-Key: rpt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`} />
      </Section>

      <Section title="Upload Endpoint">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>POST</strong> <code className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">/api/v1/projects/{`{slug}`}/runs/</code>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Send the raw Playwright <code className="font-mono text-xs">results.json</code> as the request body with{' '}
          <code className="font-mono text-xs">Content-Type: application/json</code>.
        </p>
        <CodeBlock code={curlExample} />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Response (201 Created):</p>
        <CodeBlock code={uploadResponse} language="json" />
      </Section>

      <Section title="Playwright Config">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enable the JSON reporter in your <code className="font-mono text-xs">playwright.config.ts</code>:
        </p>
        <CodeBlock code={playwrightConfig} language="typescript" />
      </Section>

      <Section title="Jenkins Integration">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Add to your Jenkinsfile. Set these environment variables in Jenkins:
        </p>
        <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
          <li><code className="font-mono text-xs">REPORT_DASHBOARD_URL</code> — this server's base URL</li>
          <li><code className="font-mono text-xs">PROJECT_SLUG</code> — your project's slug</li>
          <li><code className="font-mono text-xs">REPORT_API_KEY</code> — your project API key (store as Secret Text)</li>
        </ul>
        <CodeBlock code={jenkinsfile} language="groovy" />
      </Section>

      <Section title="All Endpoints">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2">
          <EndpointRow method="GET"    path="/api/v1/projects/"                                 description="List all projects" />
          <EndpointRow method="POST"   path="/api/v1/projects/"                                 description="Create project" />
          <EndpointRow method="GET"    path="/api/v1/projects/{slug}/"                          description="Get project detail" />
          <EndpointRow method="PUT"    path="/api/v1/projects/{slug}/"                          description="Update project" />
          <EndpointRow method="DELETE" path="/api/v1/projects/{slug}/"                          description="Delete project" />
          <EndpointRow method="POST"   path="/api/v1/projects/{slug}/api-key/"                  description="Generate/reset API key" />
          <EndpointRow method="GET"    path="/api/v1/projects/{slug}/runs/"                     description="List runs (paginated)" />
          <EndpointRow method="POST"   path="/api/v1/projects/{slug}/runs/"                     description="Upload report (API key required)" />
          <EndpointRow method="GET"    path="/api/v1/projects/{slug}/runs/latest/"              description="Get latest run" />
          <EndpointRow method="GET"    path="/api/v1/projects/{slug}/runs/{number}/"            description="Get run detail" />
          <EndpointRow method="GET"    path="/api/v1/projects/{slug}/runs/{number}/cases/"      description="List test cases (filterable)" />
          <EndpointRow method="GET"    path="/api/v1/test-cases/{id}/"                          description="Get single test case" />
          <EndpointRow method="POST"   path="/api/v1/projects/{slug}/upload/"                   description="File upload (multipart)" />
          <EndpointRow method="GET"    path="/api/v1/projects/{slug}/trends/"                   description="Trend data for charts" />
          <EndpointRow method="GET"    path="/api/v1/projects/{slug}/stats/"                    description="Project stats summary" />
          <EndpointRow method="GET"    path="/api/v1/projects/{slug}/top-failures/"             description="Top failing tests" />
          <EndpointRow method="GET"    path="/api/v1/projects/{slug}/top-flaky/"                description="Top flaky tests" />
        </div>
      </Section>

      <Section title="Error Responses">
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p><code className="font-mono text-xs">401</code> — Missing or invalid API key</p>
          <p><code className="font-mono text-xs">400</code> — Invalid JSON body</p>
          <p><code className="font-mono text-xs">404</code> — Project or run not found</p>
          <p><code className="font-mono text-xs">422</code> — JSON structure not recognized as a Playwright report</p>
          <p><code className="font-mono text-xs">500</code> — Internal server error</p>
        </div>
      </Section>
    </div>
  )
}
