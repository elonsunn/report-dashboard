"""
Business logic layer — all database operations go through here.
Views should never touch models directly.
"""

import re
import secrets

from django.db.models import Count, Q, TextField
from django.db.models.functions import Cast

from .models import Project, TestRun, TestCase


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------

def _slugify(name: str) -> str:
    """Convert a project name to a URL-safe slug."""
    slug = name.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')


def create_project(name: str, description: str = '') -> Project:
    base_slug = _slugify(name)
    slug = base_slug
    counter = 1
    while Project.objects.filter(slug=slug).exists():
        slug = f'{base_slug}-{counter}'
        counter += 1

    return Project.objects.create(name=name, slug=slug, description=description)


def get_project_by_slug(slug: str) -> Project:
    try:
        return Project.objects.get(slug=slug)
    except Project.DoesNotExist:
        raise Project.DoesNotExist(f"Project '{slug}' not found")


def list_projects() -> list:
    """Return all projects, each with the latest run summary attached."""
    projects = Project.objects.all()
    result = []
    for project in projects:
        latest = get_latest_run(project)
        result.append({'project': project, 'latest_run': latest})
    return result


def update_project(slug: str, **kwargs) -> Project:
    project = get_project_by_slug(slug)
    allowed  = {'name', 'description'}
    nullable = {'jenkins_url'}
    for key, value in kwargs.items():
        if key in allowed and value is not None:
            setattr(project, key, value)
        elif key in nullable:
            # Allow explicit clearing: empty string or None both become NULL
            setattr(project, key, value or None)
    project.save()   # auto_now=True on updated_at handles the timestamp
    return project


def trigger_jenkins(project: Project, sprint: str = '') -> dict:
    """POST to the project's Jenkins trigger URL using Basic Auth from env vars."""
    import base64
    import os
    import urllib.request
    import urllib.error

    if not project.jenkins_url:
        raise ValueError("No Jenkins URL configured for this project")

    user  = os.environ.get('JENKINS_USER', '')
    token = os.environ.get('JENKINS_TOKEN', '')
    if not user or not token:
        raise ValueError("JENKINS_USER and JENKINS_TOKEN must be set in environment")

    credentials = base64.b64encode(f'{user}:{token}'.encode()).decode()
    req = urllib.request.Request(
        project.jenkins_url,
        method='POST',
        data=b'',
        headers={
            'Authorization': f'Basic {credentials}',
            'Content-Type':  'application/json',
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            status_code = resp.status
    except urllib.error.HTTPError as e:
        # Jenkins remote trigger typically returns 201 or 302 on success
        if e.code in (200, 201, 302):
            status_code = e.code
        else:
            raise ValueError(f"Jenkins responded with HTTP {e.code}: {e.reason}")
    except urllib.error.URLError as e:
        raise ValueError(f"Could not reach Jenkins: {e.reason}")

    # Persist the sprint so the next uploaded run inherits it
    project.pending_sprint = sprint.strip() or None
    project.save(update_fields=['pending_sprint'])
    return {'status_code': status_code, 'message': 'Build triggered'}


def delete_project(slug: str) -> None:
    project = get_project_by_slug(slug)
    project.delete()   # CASCADE: deletes TestRun → TestCase transitively


def generate_api_key(slug: str) -> str:
    """Generate or regenerate an API key for the project. Returns the new key."""
    project = get_project_by_slug(slug)
    key = 'rpt_' + secrets.token_hex(16)   # "rpt_" + 32 hex chars
    project.api_key = key
    project.save()
    return key


def get_project_by_api_key(api_key: str) -> Project | None:
    return Project.objects.filter(api_key=api_key).first()


# ---------------------------------------------------------------------------
# Test Runs
# ---------------------------------------------------------------------------

def _determine_run_status(summary: dict) -> str:
    """Determine overall run status from the summary counts."""
    if summary['failed'] > 0:
        return 'failed'
    if summary['flaky'] > 0:
        return 'flaky'
    return 'passed'


def create_test_run(project: Project, parsed_data: dict) -> TestRun:
    """
    Persist a parsed Playwright report as a TestRun + TestCase rows.
    Auto-increments run_number within the project.
    """
    run_info = parsed_data['run_info']

    # Auto-increment run_number
    last_run = TestRun.objects.filter(project=project).order_by('-run_number').first()
    run_number = (last_run.run_number + 1) if last_run else 1

    # Build JSONB dicts for embedded data
    s = run_info['summary']
    summary = {
        'total':     s['total'],
        'passed':    s['passed'],
        'failed':    s['failed'],
        'flaky':     s['flaky'],
        'skipped':   s['skipped'],
        'pass_rate': s['pass_rate'],
    }

    env_raw = run_info['environment']
    environment = {
        'playwright_version': env_raw.get('playwright_version'),
        'workers':            env_raw.get('workers'),
        'actual_workers':     env_raw.get('actual_workers'),
    }

    ci_raw = run_info['ci_info']
    ci_info = {
        'commit_href':    ci_raw.get('commit_href'),
        'commit_hash':    ci_raw.get('commit_hash'),
        'branch':         ci_raw.get('branch'),
        'commit_subject': ci_raw.get('commit_subject'),
        'commit_author':  ci_raw.get('commit_author'),
    }

    run = TestRun(
        project=project,
        run_number=run_number,
        status=_determine_run_status(s),
        summary=summary,
        duration=run_info['duration'],
        started_at=run_info['started_at'],
        environment=environment,
        ci_info=ci_info,
        sprint=project.pending_sprint,
    )
    run.save()

    # Clear the pending sprint now that it has been claimed by this run
    if project.pending_sprint:
        project.pending_sprint = None
        project.save(update_fields=['pending_sprint'])

    # Bulk-create test cases
    test_case_rows = []
    for tc_data in parsed_data['test_cases']:
        error_details = [
            {
                'message': e.get('message'),
                'file':    e.get('file'),
                'line':    e.get('line'),
                'column':  e.get('column'),
            }
            for e in tc_data.get('error_details', [])
        ]
        retry_results = [
            {
                'retry':    r.get('retry', 0),
                'status':   r.get('status', ''),
                'duration': r.get('duration', 0),
            }
            for r in tc_data.get('results', [])
        ]
        tc = TestCase(
            run=run,
            project=project,
            spec_id=tc_data.get('spec_id', ''),
            title=tc_data['title'],
            suite_title=tc_data.get('suite_title', ''),
            file_path=tc_data.get('file_path', ''),
            line=tc_data.get('line'),
            tags=tc_data.get('tags') or [],
            project_name=tc_data.get('project_name', ''),
            status=tc_data['status'],
            duration=tc_data.get('duration', 0),
            retry_count=tc_data.get('retry_count', 0),
            error_message=tc_data.get('error_message'),
            error_details=error_details,
            results=retry_results,
        )
        test_case_rows.append(tc)

    if test_case_rows:
        TestCase.objects.bulk_create(test_case_rows)

    return run


def delete_test_run(project: Project, run_number: int) -> None:
    """Delete a test run and all its associated test cases."""
    run = get_test_run(project, run_number)
    TestCase.objects.filter(run=run).delete()
    run.delete()


def get_test_run(project: Project, run_number: int) -> TestRun:
    try:
        return TestRun.objects.get(project=project, run_number=run_number)
    except TestRun.DoesNotExist:
        raise TestRun.DoesNotExist(f'Run #{run_number} not found')


def get_latest_run(project: Project) -> TestRun | None:
    return TestRun.objects.filter(project=project).order_by('-run_number').first()


def list_test_runs(project: Project, page: int = 1, per_page: int = 20) -> tuple:
    """Returns (runs_list, total_count)."""
    qs     = TestRun.objects.filter(project=project).order_by('-run_number')
    total  = qs.count()
    offset = (page - 1) * per_page
    runs   = list(qs[offset: offset + per_page])
    return runs, total


def get_run_trends(project: Project, limit: int = 30) -> list:
    """Return last N runs ordered oldest-first for charting."""
    runs = list(
        TestRun.objects.filter(project=project)
        .order_by('-run_number')[:limit]
    )
    return list(reversed(runs))


# ---------------------------------------------------------------------------
# Test Cases
# ---------------------------------------------------------------------------

def list_test_cases(run: TestRun, status_filter: str | None = None, search: str | None = None):
    qs = TestCase.objects.filter(run=run)
    if status_filter and status_filter in ('passed', 'failed', 'flaky', 'skipped'):
        qs = qs.filter(status=status_filter)
    if search:
        pattern = re.escape(search)
        # Cast the tags array to text (PostgreSQL: "{tag1,tag2,...}") so we can
        # do a substring regex search across all tag values in one pass.
        qs = qs.annotate(_tags_str=Cast('tags', output_field=TextField()))
        qs = qs.filter(Q(title__iregex=pattern) | Q(_tags_str__iregex=pattern))
    return qs.order_by('file_path', 'title')


def get_test_case(test_case_id: str) -> TestCase:
    try:
        return TestCase.objects.get(pk=test_case_id)
    except TestCase.DoesNotExist:
        raise TestCase.DoesNotExist(f"TestCase '{test_case_id}' not found")


def get_top_failing_tests(project: Project, limit: int = 10) -> list:
    """Return tests ordered by failure count across all runs."""
    return list(
        TestCase.objects
        .filter(project=project, status='failed')
        .values('title', 'file_path')
        .annotate(count=Count('id'))
        .order_by('-count')[:limit]
    )


def get_flaky_tests(project: Project, limit: int = 10) -> list:
    """Return tests ordered by flaky count across all runs."""
    return list(
        TestCase.objects
        .filter(project=project, status='flaky')
        .values('title', 'file_path')
        .annotate(count=Count('id'))
        .order_by('-count')[:limit]
    )
