# Report Dashboard

A Playwright test report dashboard for tracking test runs, visualizing trends, and integrating with CI/CD pipelines.

## Features

- Upload Playwright JSON reports via drag-and-drop UI or REST API
- View test results grouped by file with pass/fail/flaky/skip status
- Track pass rate, duration, and test count trends over time
- Top failing and flaky test analysis
- CI/CD integration with Jenkins (upload reports and trigger builds remotely)
- Multiple projects with isolated run histories

## Tech Stack

- **Backend**: Django (API-only) + PostgreSQL (JSONB for embedded data)
- **Frontend**: React + Vite + Tailwind CSS + recharts
- **Auth**: API key per project (`rpt_` prefix)

---

## Quick Start (Docker)

```bash
git clone <repo-url>
cd report-dashboard
cp .env.example .env        # edit DJANGO_SECRET_KEY, POSTGRES_PASSWORD, JENKINS_USER, JENKINS_TOKEN
docker compose up -d

# Open the dashboard
open http://localhost:3000
```

---

## Local Development

### Prerequisites

- Python 3.11+, [`uv`](https://docs.astral.sh/uv/)
- Node.js 20+
- PostgreSQL running on `localhost:5432`

### Backend

```bash
cd backend
uv sync

# Copy and edit .env
cp ../.env.example .env

uv run python manage.py migrate
uv run python manage.py runserver
# API available at http://localhost:8000/api/v1/
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173/
# /api/* requests are proxied to http://localhost:8000
```

---

## Playwright Config

Enable the JSON reporter in your `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  reporter: [
    ['html'],                                // local HTML report
    ['json', { outputFile: 'results.json' }] // JSON for dashboard upload
  ],
})
```

---

## API Upload

After creating a project and generating an API key in Settings:

```bash
curl -X POST https://your-domain/api/v1/projects/your-project-slug/runs/ \
  -H "Authorization: Bearer rpt_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d @results.json
```

---

## Jenkins Integration

### Uploading reports from Jenkins

Store `REPORT_API_KEY` as a Secret Text credential in Jenkins.

```groovy
pipeline {
  agent any
  environment {
    REPORT_DASHBOARD_URL = 'https://your-domain'
    PROJECT_SLUG         = 'your-project-slug'
    REPORT_API_KEY       = credentials('report-dashboard-api-key')
  }
  stages {
    stage('Test') {
      steps {
        sh 'npx playwright test --reporter=json'
      }
    }
  }
  post {
    always {
      sh '''
        curl -X POST ${REPORT_DASHBOARD_URL}/api/v1/projects/${PROJECT_SLUG}/runs/ \
          -H "Authorization: Bearer ${REPORT_API_KEY}" \
          -H "Content-Type: application/json" \
          -d @playwright-report/results.json
      '''
    }
  }
}
```

### Triggering a build from the dashboard

Each project can store a Jenkins remote trigger URL in **Settings → Jenkins Trigger URL**:

```
http://your-jenkins/job/your-job/build?token=YOUR_TOKEN&cause=Cause+TriggerFromReportDashboard
```

A **Trigger Pipeline** button then appears on the latest run, run history, trends, and upload pages. Clicking it POSTs to that URL using the credentials set in the environment:

```env
JENKINS_USER=your-jenkins-username
JENKINS_TOKEN=your-jenkins-api-token   # Jenkins user API token (not password)
```

To generate a Jenkins API token: **Jenkins → Your Profile → Configure → API Token → Add new Token**.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/projects/` | List all projects |
| POST | `/api/v1/projects/` | Create project |
| GET | `/api/v1/projects/{slug}/` | Get project |
| PUT | `/api/v1/projects/{slug}/` | Update project |
| DELETE | `/api/v1/projects/{slug}/` | Delete project |
| POST | `/api/v1/projects/{slug}/api-key/` | Generate API key |
| POST | `/api/v1/projects/{slug}/trigger/` | Trigger Jenkins build |
| GET | `/api/v1/projects/{slug}/runs/` | List runs (paginated) |
| POST | `/api/v1/projects/{slug}/runs/` | Upload report (API key required) |
| GET | `/api/v1/projects/{slug}/runs/latest/` | Get latest run |
| GET | `/api/v1/projects/{slug}/runs/{n}/` | Get run detail |
| DELETE | `/api/v1/projects/{slug}/runs/{n}/` | Delete run |
| GET | `/api/v1/projects/{slug}/runs/{n}/cases/` | List test cases |
| GET | `/api/v1/test-cases/{id}/` | Get single test case |
| GET | `/api/v1/projects/{slug}/trends/` | Trend data |
| GET | `/api/v1/projects/{slug}/stats/` | Project stats |
| GET | `/api/v1/projects/{slug}/top-failures/` | Top failing tests |
| GET | `/api/v1/projects/{slug}/top-flaky/` | Top flaky tests |

---

## Environment Variables

```env
DJANGO_SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

POSTGRES_DB=report_dashboard
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

JENKINS_USER=your-jenkins-username
JENKINS_TOKEN=your-jenkins-api-token
```
