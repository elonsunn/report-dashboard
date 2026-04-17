"""
Django models for the report dashboard, backed by PostgreSQL.

Tables:
  - projects    → Project
  - test_runs   → TestRun   (summary / environment / ci_info stored as JSONB)
  - test_cases  → TestCase  (error_details / results stored as JSONB arrays)
"""

from django.db import models
from django.contrib.postgres.fields import ArrayField


# ---------------------------------------------------------------------------
# Project
# ---------------------------------------------------------------------------

class Project(models.Model):
    name        = models.CharField(max_length=200)
    slug        = models.SlugField(max_length=200, unique=True)
    description = models.TextField(default='', blank=True)
    # API key for CI/CD integrations — format: "rpt_" + 32-char hex
    # NULL means key not yet generated
    api_key     = models.CharField(max_length=100, null=True, blank=True, unique=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'projects'
        ordering = ['-created_at']

    def __str__(self):
        return f'Project({self.slug})'


# ---------------------------------------------------------------------------
# TestRun
# ---------------------------------------------------------------------------

class TestRun(models.Model):
    project    = models.ForeignKey(Project, on_delete=models.CASCADE)
    run_number = models.IntegerField()
    status     = models.CharField(
        max_length=20, default='passed',
        choices=[('passed', 'Passed'), ('failed', 'Failed'), ('flaky', 'Flaky')],
    )
    # Embedded data stored as JSONB columns
    # summary    → {"total": int, "passed": int, "failed": int, "flaky": int, "skipped": int, "pass_rate": float}
    # environment → {"playwright_version": str, "workers": int, "actual_workers": int}
    # ci_info    → {"commit_href": str, "commit_hash": str, "branch": str, "commit_subject": str, "commit_author": str}
    summary     = models.JSONField(null=True, blank=True)
    duration    = models.FloatField(null=True, blank=True)  # milliseconds
    started_at  = models.DateTimeField(null=True, blank=True)
    environment = models.JSONField(null=True, blank=True)
    ci_info     = models.JSONField(null=True, blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'test_runs'
        ordering = ['-run_number']
        constraints = [
            models.UniqueConstraint(
                fields=['project', 'run_number'],
                name='unique_project_run_number',
            )
        ]

    def __str__(self):
        return f'TestRun(project={self.project_id}, run={self.run_number})'


# ---------------------------------------------------------------------------
# TestCase
# ---------------------------------------------------------------------------

class TestCase(models.Model):
    run          = models.ForeignKey(TestRun, on_delete=models.CASCADE)
    project      = models.ForeignKey(Project, on_delete=models.CASCADE)
    spec_id      = models.CharField(max_length=200, blank=True, default='')
    title        = models.CharField(max_length=500)
    suite_title  = models.CharField(max_length=500, blank=True, default='')
    file_path    = models.CharField(max_length=500, blank=True, default='')
    line         = models.IntegerField(null=True, blank=True)
    tags         = ArrayField(models.CharField(max_length=200), default=list, blank=True)
    project_name = models.CharField(max_length=200, blank=True, default='')
    status       = models.CharField(
        max_length=20,
        choices=[('passed', 'Passed'), ('failed', 'Failed'), ('flaky', 'Flaky'), ('skipped', 'Skipped')],
    )
    duration      = models.FloatField(null=True, blank=True)  # milliseconds
    retry_count   = models.IntegerField(default=0)
    error_message = models.TextField(null=True, blank=True)
    # error_details → [{"message": str, "file": str, "line": int, "column": int}, ...]
    # results       → [{"retry": int, "status": str, "duration": float}, ...]
    error_details = models.JSONField(null=True, blank=True)
    results       = models.JSONField(null=True, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'test_cases'
        indexes = [
            models.Index(fields=['run']),
            models.Index(fields=['project', 'spec_id']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'TestCase({self.title[:50]}, {self.status})'
