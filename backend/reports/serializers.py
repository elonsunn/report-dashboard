"""
Serializers — convert Django model instances to JSON-serializable dicts.
These are plain functions, not classes, to keep things lightweight.

Embedded data (summary, environment, ci_info, error_details, results) is
stored as JSONB in PostgreSQL and accessed as plain Python dicts.
"""

from datetime import datetime


def _fmt_dt(dt) -> str | None:
    """Format a datetime to ISO 8601 string with Z suffix, or None.

    isoformat() on a timezone-aware datetime returns "...+00:00"; appending
    another "Z" would produce "...+00:00Z" which is invalid and causes
    JavaScript's new Date() to return Invalid Date.
    """
    if dt is None:
        return None
    if isinstance(dt, datetime):
        # Strip any explicit UTC offset (+00:00) then append Z
        return dt.isoformat().replace('+00:00', '') + 'Z'
    return str(dt)


def serialize_project(project, latest_run=None) -> dict:
    d = {
        "id":          str(project.id),
        "name":        project.name,
        "slug":        project.slug,
        "description": project.description,
        "has_api_key": bool(project.api_key),
        "jenkins_url": project.jenkins_url,
        "created_at":  _fmt_dt(project.created_at),
        "updated_at":  _fmt_dt(project.updated_at),
    }
    if latest_run:
        d["latest_run"] = serialize_run_summary(latest_run)
    else:
        d["latest_run"] = None
    return d


def serialize_run(run) -> dict:
    summary = None
    if run.summary:
        summary = {
            "total":     run.summary.get('total', 0),
            "passed":    run.summary.get('passed', 0),
            "failed":    run.summary.get('failed', 0),
            "flaky":     run.summary.get('flaky', 0),
            "skipped":   run.summary.get('skipped', 0),
            "pass_rate": run.summary.get('pass_rate', 0.0),
        }

    environment = None
    if run.environment:
        environment = {
            "playwright_version": run.environment.get('playwright_version'),
            "workers":            run.environment.get('workers'),
            "actual_workers":     run.environment.get('actual_workers'),
        }

    ci_info = None
    if run.ci_info:
        ci_info = {
            "commit_href":    run.ci_info.get('commit_href'),
            "commit_hash":    run.ci_info.get('commit_hash'),
            "branch":         run.ci_info.get('branch'),
            "commit_subject": run.ci_info.get('commit_subject'),
            "commit_author":  run.ci_info.get('commit_author'),
        }

    return {
        "id":          str(run.id),
        "run_number":  run.run_number,
        "status":      run.status,
        "summary":     summary,
        "duration":    run.duration,
        "started_at":  _fmt_dt(run.started_at),
        "environment": environment,
        "ci_info":     ci_info,
        "sprint":      run.sprint,
        "created_at":  _fmt_dt(run.created_at),
    }


def serialize_run_summary(run) -> dict:
    """Lightweight summary for list views — no environment details."""
    summary = None
    if run.summary:
        summary = {
            "total":     run.summary.get('total', 0),
            "passed":    run.summary.get('passed', 0),
            "failed":    run.summary.get('failed', 0),
            "flaky":     run.summary.get('flaky', 0),
            "skipped":   run.summary.get('skipped', 0),
            "pass_rate": run.summary.get('pass_rate', 0.0),
        }
    ci_info = None
    if run.ci_info:
        ci_info = {
            "commit_hash":    run.ci_info.get('commit_hash'),
            "commit_href":    run.ci_info.get('commit_href'),
            "branch":         run.ci_info.get('branch'),
            "commit_subject": run.ci_info.get('commit_subject'),
        }
    return {
        "id":         str(run.id),
        "run_number": run.run_number,
        "status":     run.status,
        "summary":    summary,
        "duration":   run.duration,
        "started_at": _fmt_dt(run.started_at),
        "ci_info":    ci_info,
        "sprint":     run.sprint,
        "created_at": _fmt_dt(run.created_at),
    }


def serialize_test_case(tc) -> dict:
    error_details = [
        {
            "message": e.get('message'),
            "file":    e.get('file'),
            "line":    e.get('line'),
            "column":  e.get('column'),
        }
        for e in (tc.error_details or [])
    ]
    results = [
        {
            "retry":    r.get('retry'),
            "status":   r.get('status'),
            "duration": r.get('duration'),
        }
        for r in (tc.results or [])
    ]
    return {
        "id":            str(tc.id),
        "spec_id":       tc.spec_id,
        "title":         tc.title,
        "suite_title":   tc.suite_title,
        "file_path":     tc.file_path,
        "line":          tc.line,
        "tags":          list(tc.tags or []),
        "project_name":  tc.project_name,
        "status":        tc.status,
        "duration":      tc.duration,
        "retry_count":   tc.retry_count,
        "error_message": tc.error_message,
        "error_details": error_details,
        "results":       results,
        "created_at":    _fmt_dt(tc.created_at),
    }
