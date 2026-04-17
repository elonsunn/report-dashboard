"""
Tests for Django models backed by PostgreSQL.

Run with:
    cd backend
    python manage.py test tests.test_models
  or via pytest (requires a running PostgreSQL instance):
    python -m pytest tests/test_models.py -v
"""

import pytest
from django.test import TestCase
from reports.models import Project, TestRun, TestCase as TestCaseModel


# ---------------------------------------------------------------------------
# Project tests
# ---------------------------------------------------------------------------

class TestProject(TestCase):
    def test_create_project(self):
        p = Project.objects.create(name='Test Project', slug='test-project')
        self.assertIsNotNone(p.id)
        self.assertEqual(p.slug, 'test-project')

    def test_slug_unique(self):
        Project.objects.create(name='Dup', slug='dup-slug')
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Project.objects.create(name='Dup2', slug='dup-slug')

    def test_multiple_projects_can_have_null_api_key(self):
        """Multiple projects can have NULL api_key (nullable unique column)."""
        p1 = Project.objects.create(name='P1', slug='p1-model')
        p2 = Project.objects.create(name='P2', slug='p2-model')
        self.assertIsNone(p1.api_key)
        self.assertIsNone(p2.api_key)

    def test_api_key_lookup(self):
        Project.objects.create(name='KeyTest', slug='key-test-model', api_key='rpt_abc123')
        fetched = Project.objects.filter(api_key='rpt_abc123').first()
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched.slug, 'key-test-model')


# ---------------------------------------------------------------------------
# TestRun tests
# ---------------------------------------------------------------------------

class TestTestRun(TestCase):
    def setUp(self):
        self.project = Project.objects.create(name='RunTest', slug='run-test-model')

    def test_create_run(self):
        run = TestRun.objects.create(
            project=self.project,
            run_number=1,
            status='failed',
            summary={'total': 17, 'passed': 16, 'failed': 1, 'flaky': 0, 'skipped': 0, 'pass_rate': 94.12},
            duration=824354.984,
        )
        self.assertIsNotNone(run.id)
        self.assertEqual(run.run_number, 1)
        self.assertEqual(run.summary['passed'], 16)

    def test_run_number_unique_per_project(self):
        TestRun.objects.create(project=self.project, run_number=1, status='passed')
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            TestRun.objects.create(project=self.project, run_number=1, status='passed')

    def test_cascade_delete(self):
        run = TestRun.objects.create(project=self.project, run_number=1, status='passed')
        tc = TestCaseModel.objects.create(run=run, project=self.project, title='T1', status='passed')
        tc_id = tc.id
        run_id = run.id
        # Deleting the project should cascade to run and test cases
        self.project.delete()
        self.assertFalse(TestRun.objects.filter(id=run_id).exists())
        self.assertFalse(TestCaseModel.objects.filter(id=tc_id).exists())


# ---------------------------------------------------------------------------
# TestCase model tests
# ---------------------------------------------------------------------------

class TestTestCaseModel(TestCase):
    def setUp(self):
        self.project = Project.objects.create(name='TCTest', slug='tc-test-model')
        self.run = TestRun.objects.create(project=self.project, run_number=1, status='passed')

    def test_create_test_case(self):
        tc = TestCaseModel.objects.create(
            run=self.run,
            project=self.project,
            title='My Test',
            status='passed',
            duration=1234.5,
            tags=['smoke', 'regression'],
            retry_count=0,
        )
        self.assertIsNotNone(tc.id)
        self.assertEqual(tc.tags, ['smoke', 'regression'])

    def test_query_by_status(self):
        TestCaseModel.objects.create(run=self.run, project=self.project, title='Pass', status='passed')
        TestCaseModel.objects.create(run=self.run, project=self.project, title='Fail', status='failed')
        failed = TestCaseModel.objects.filter(run=self.run, status='failed')
        self.assertEqual(failed.count(), 1)
        self.assertEqual(failed.first().title, 'Fail')
