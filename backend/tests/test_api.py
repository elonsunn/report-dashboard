"""
API endpoint tests using Django's test client.

Run with:
    cd backend
    python manage.py test tests.test_api
  or via pytest (requires a running PostgreSQL instance):
    python -m pytest tests/test_api.py -v
"""

import json
import os

from django.test import TestCase, Client
from reports.models import Project, TestRun, TestCase as TestCaseModel

FIXTURE_PATH = os.path.join(
    os.path.dirname(__file__), 'fixtures', 'sample_report.json'
)


def _load_report():
    with open(FIXTURE_PATH) as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Project endpoints
# ---------------------------------------------------------------------------

class TestProjectEndpoints(TestCase):
    def setUp(self):
        self.client = Client()

    def test_list_projects_empty(self):
        r = self.client.get('/api/v1/projects/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(json.loads(r.content)['projects'], [])

    def test_create_project(self):
        r = self.client.post(
            '/api/v1/projects/',
            data=json.dumps({'name': 'My Project', 'description': 'desc'}),
            content_type='application/json',
        )
        self.assertEqual(r.status_code, 201)
        data = json.loads(r.content)
        self.assertEqual(data['name'], 'My Project')
        self.assertEqual(data['slug'], 'my-project')

    def test_create_project_missing_name(self):
        r = self.client.post(
            '/api/v1/projects/',
            data=json.dumps({'description': 'no name'}),
            content_type='application/json',
        )
        self.assertEqual(r.status_code, 400)

    def test_get_project(self):
        p = Project.objects.create(
            name='API Test Project',
            slug='api-test-proj',
            api_key='rpt_testapikey1234567890123456789012',
        )
        r = self.client.get(f'/api/v1/projects/{p.slug}/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(json.loads(r.content)['slug'], p.slug)

    def test_get_nonexistent_project(self):
        r = self.client.get('/api/v1/projects/does-not-exist/')
        self.assertEqual(r.status_code, 404)

    def test_generate_api_key(self):
        p = Project.objects.create(name='KeyProj', slug='key-proj')
        r = self.client.post(f'/api/v1/projects/{p.slug}/api-key/')
        self.assertEqual(r.status_code, 200)
        data = json.loads(r.content)
        self.assertTrue(data['api_key'].startswith('rpt_'))

    def test_delete_project(self):
        p = Project.objects.create(name='ToDelete', slug='to-delete-api')
        r = self.client.delete(f'/api/v1/projects/{p.slug}/')
        self.assertEqual(r.status_code, 200)
        self.assertFalse(Project.objects.filter(slug='to-delete-api').exists())


# ---------------------------------------------------------------------------
# Upload / Test Run endpoints
# ---------------------------------------------------------------------------

class TestRunEndpoints(TestCase):
    def setUp(self):
        self.client = Client()
        self.project = Project.objects.create(
            name='API Test Project',
            slug='api-test-proj',
            api_key='rpt_testapikey1234567890123456789012',
        )
        self.api_key = self.project.api_key
        self.report_json = _load_report()

    def test_upload_requires_auth(self):
        r = self.client.post(
            f'/api/v1/projects/{self.project.slug}/runs/',
            data=json.dumps(self.report_json),
            content_type='application/json',
        )
        self.assertEqual(r.status_code, 401)

    def test_upload_invalid_key(self):
        r = self.client.post(
            f'/api/v1/projects/{self.project.slug}/runs/',
            data=json.dumps(self.report_json),
            content_type='application/json',
            HTTP_AUTHORIZATION='Bearer rpt_wrongkey',
        )
        self.assertEqual(r.status_code, 401)

    def test_upload_success(self):
        r = self.client.post(
            f'/api/v1/projects/{self.project.slug}/runs/',
            data=json.dumps(self.report_json),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.api_key}',
        )
        self.assertEqual(r.status_code, 201)
        data = json.loads(r.content)
        self.assertEqual(data['run_number'], 1)
        self.assertEqual(data['summary']['total'], 17)

    def test_upload_invalid_json(self):
        r = self.client.post(
            f'/api/v1/projects/{self.project.slug}/runs/',
            data='not-json',
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.api_key}',
        )
        self.assertEqual(r.status_code, 400)

    def test_web_upload_no_auth_required(self):
        """The /upload/ endpoint (web UI) does not require an API key."""
        import io
        file_data = json.dumps(self.report_json).encode('utf-8')
        r = self.client.post(
            f'/api/v1/projects/{self.project.slug}/upload/',
            data={'file': io.BytesIO(file_data)},
        )
        self.assertEqual(r.status_code, 201)
        data = json.loads(r.content)
        self.assertGreaterEqual(data['run_number'], 1)

    def test_list_runs(self):
        r = self.client.get(f'/api/v1/projects/{self.project.slug}/runs/')
        self.assertEqual(r.status_code, 200)
        data = json.loads(r.content)
        self.assertIn('runs', data)
        self.assertIn('total', data)

    def test_get_latest_run(self):
        r = self.client.get(f'/api/v1/projects/{self.project.slug}/runs/latest/')
        self.assertEqual(r.status_code, 200)

    def test_get_run_detail(self):
        # Upload a run first
        self.client.post(
            f'/api/v1/projects/{self.project.slug}/runs/',
            data=json.dumps(self.report_json),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.api_key}',
        )
        run = TestRun.objects.filter(project=self.project).first()
        if run:
            r = self.client.get(f'/api/v1/projects/{self.project.slug}/runs/{run.run_number}/')
            self.assertEqual(r.status_code, 200)
            data = json.loads(r.content)
            self.assertEqual(data['run']['run_number'], run.run_number)

    def test_get_nonexistent_run(self):
        r = self.client.get(f'/api/v1/projects/{self.project.slug}/runs/99999/')
        self.assertEqual(r.status_code, 404)

    def test_delete_run(self):
        # Upload a run to delete
        r = self.client.post(
            f'/api/v1/projects/{self.project.slug}/runs/',
            data=json.dumps(self.report_json),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.api_key}',
        )
        self.assertEqual(r.status_code, 201)
        run_number = json.loads(r.content)['run_number']

        r = self.client.delete(f'/api/v1/projects/{self.project.slug}/runs/{run_number}/')
        self.assertEqual(r.status_code, 200)
        self.assertIn('deleted', json.loads(r.content)['message'].lower())

        r = self.client.get(f'/api/v1/projects/{self.project.slug}/runs/{run_number}/')
        self.assertEqual(r.status_code, 404)

    def test_delete_nonexistent_run(self):
        r = self.client.delete(f'/api/v1/projects/{self.project.slug}/runs/99999/')
        self.assertEqual(r.status_code, 404)


# ---------------------------------------------------------------------------
# Test Case endpoints
# ---------------------------------------------------------------------------

class TestCaseEndpoints(TestCase):
    def setUp(self):
        self.client = Client()
        self.project = Project.objects.create(
            name='API Test Project',
            slug='api-test-proj',
            api_key='rpt_testapikey1234567890123456789012',
        )
        report_json = _load_report()
        # Upload one run to use in case tests
        self.client.post(
            f'/api/v1/projects/{self.project.slug}/runs/',
            data=json.dumps(report_json),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.project.api_key}',
        )
        self.run = TestRun.objects.filter(project=self.project).first()

    def test_list_cases(self):
        if self.run:
            r = self.client.get(f'/api/v1/projects/{self.project.slug}/runs/{self.run.run_number}/cases/')
            self.assertEqual(r.status_code, 200)
            data = json.loads(r.content)
            self.assertEqual(data['total'], 17)

    def test_filter_by_status(self):
        if self.run:
            r = self.client.get(
                f'/api/v1/projects/{self.project.slug}/runs/{self.run.run_number}/cases/?status=failed'
            )
            data = json.loads(r.content)
            self.assertTrue(all(tc['status'] == 'failed' for tc in data['test_cases']))

    def test_search_cases(self):
        if self.run:
            r = self.client.get(
                f'/api/v1/projects/{self.project.slug}/runs/{self.run.run_number}/cases/?search=Login'
            )
            self.assertEqual(r.status_code, 200)


# ---------------------------------------------------------------------------
# Trends & Stats endpoints
# ---------------------------------------------------------------------------

class TestTrendsEndpoints(TestCase):
    def setUp(self):
        self.client = Client()
        self.project = Project.objects.create(
            name='API Test Project',
            slug='api-test-proj',
            api_key='rpt_testapikey1234567890123456789012',
        )

    def test_trends(self):
        r = self.client.get(f'/api/v1/projects/{self.project.slug}/trends/')
        self.assertEqual(r.status_code, 200)
        self.assertIn('trends', json.loads(r.content))

    def test_stats(self):
        r = self.client.get(f'/api/v1/projects/{self.project.slug}/stats/')
        self.assertEqual(r.status_code, 200)
        data = json.loads(r.content)
        self.assertIn('total_runs', data)

    def test_top_failures(self):
        r = self.client.get(f'/api/v1/projects/{self.project.slug}/top-failures/')
        self.assertEqual(r.status_code, 200)
        self.assertIn('top_failures', json.loads(r.content))

    def test_top_flaky(self):
        r = self.client.get(f'/api/v1/projects/{self.project.slug}/top-flaky/')
        self.assertEqual(r.status_code, 200)
        self.assertIn('top_flaky', json.loads(r.content))
