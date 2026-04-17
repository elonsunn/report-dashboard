"""
PlaywrightReportParser — converts a raw Playwright JSON report dict into
structured Python dicts ready for database persistence.

Usage:
    with open("results.json") as f:
        data = json.load(f)
    parser = PlaywrightReportParser(data)
    result = parser.parse()
    # result = {"run_info": {...}, "test_cases": [...]}
"""

import re
from datetime import datetime


class PlaywrightReportParser:

    def __init__(self, json_data: dict):
        self._data = json_data

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def parse(self) -> dict:
        """
        Returns:
            {
                "run_info": {
                    "summary":     RunSummary dict,
                    "duration":    float (ms),
                    "started_at":  datetime,
                    "environment": Environment dict,
                    "ci_info":     CIInfo dict,
                },
                "test_cases": [ TestCase dict, ... ]
            }
        """
        run_info   = self._parse_run_info()
        test_cases = self._parse_suites(self._data.get("suites", []))
        return {"run_info": run_info, "test_cases": test_cases}

    # ------------------------------------------------------------------
    # Run-level info
    # ------------------------------------------------------------------

    def _parse_run_info(self) -> dict:
        stats  = self._data.get("stats", {})
        config = self._data.get("config", {})
        meta   = config.get("metadata", {})

        # --- Summary ---
        expected   = stats.get("expected", 0)
        unexpected = stats.get("unexpected", 0)
        flaky      = stats.get("flaky", 0)
        skipped    = stats.get("skipped", 0)
        total      = expected + unexpected + flaky + skipped
        # Flaky tests eventually passed (on retry), so count them as passed
        # for pass_rate and the passed counter.  `flaky` is kept separately
        # so the run status badge can still distinguish flaky runs.
        passed    = expected + flaky
        pass_rate = round((passed / total * 100), 2) if total > 0 else 0.0

        summary = {
            "total":     total,
            "passed":    passed,
            "failed":    unexpected,
            "flaky":     flaky,
            "skipped":   skipped,
            "pass_rate": pass_rate,
        }

        # --- Duration and start time ---
        duration   = stats.get("duration", 0)
        started_at = None
        raw_start  = stats.get("startTime")
        if raw_start:
            try:
                started_at = datetime.fromisoformat(raw_start.replace("Z", "+00:00"))
            except ValueError:
                started_at = None

        # --- Environment ---
        environment = {
            "playwright_version": config.get("version"),
            "workers":            config.get("workers"),
            "actual_workers":     meta.get("actualWorkers"),
        }

        # --- CI info ---
        ci_raw    = meta.get("ci", {}) or {}
        git_raw   = meta.get("gitCommit", {}) or {}
        author    = git_raw.get("author", {}) or {}
        ci_info   = {
            "commit_href":    ci_raw.get("commitHref"),
            "commit_hash":    ci_raw.get("commitHash") or git_raw.get("hash"),
            "branch":         ci_raw.get("branch") or git_raw.get("branch"),
            "commit_subject": git_raw.get("subject"),
            "commit_author":  author.get("name"),
        }

        return {
            "summary":     summary,
            "duration":    duration,
            "started_at":  started_at,
            "environment": environment,
            "ci_info":     ci_info,
        }

    # ------------------------------------------------------------------
    # Suite traversal
    # ------------------------------------------------------------------

    def _parse_suites(self, suites: list, parent_suite_title: str = "") -> list:
        """
        Recursively traverse suites → suites → ... → specs.
        Returns a flat list of test_case dicts.
        """
        test_cases = []
        for suite in suites:
            suite_title = suite.get("title", "") or parent_suite_title
            file_path   = suite.get("file", "")

            # Parse any specs directly on this suite level
            for spec in suite.get("specs", []):
                tc = self._parse_spec(spec, suite_title, file_path)
                if tc:
                    test_cases.append(tc)

            # Recurse into child suites, passing current title as parent context
            child_suites = suite.get("suites", [])
            test_cases.extend(self._parse_suites(child_suites, suite_title))

        return test_cases

    # ------------------------------------------------------------------
    # Spec parsing
    # ------------------------------------------------------------------

    def _parse_spec(self, spec: dict, suite_title: str, file_path: str) -> dict | None:
        """Parse one spec (test case) node into a flat dict."""
        tests = spec.get("tests", [])
        if not tests:
            return None

        # Use the first test entry for metadata; retries are in results[]
        test = tests[0]

        status      = self._determine_status(test)
        results_raw = test.get("results", [])
        retry_count = max((r.get("retry", 0) for r in results_raw), default=0)

        # Collect per-attempt results
        retry_results = []
        for r in results_raw:
            retry_results.append({
                "retry":    r.get("retry", 0),
                "status":   r.get("status", ""),
                "duration": r.get("duration", 0),
            })

        # Error info — from the last non-passing result (or any result with errors)
        error_message, error_details = self._extract_errors(results_raw)

        # Duration = sum of all attempt durations
        total_duration = sum(r.get("duration", 0) for r in results_raw)

        return {
            "spec_id":      spec.get("id", ""),
            "title":        spec.get("title", ""),
            "suite_title":  suite_title,
            "file_path":    file_path or spec.get("file", ""),
            "line":         spec.get("line"),
            "tags":         spec.get("tags", []),
            "project_name": test.get("projectName", ""),
            "status":       status,
            "duration":     total_duration,
            "retry_count":  retry_count,
            "error_message": error_message,
            "error_details": error_details,
            "results":      retry_results,
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _determine_status(self, test: dict) -> str:
        """
        Map test.status to our internal status values:
          "expected"   → "passed"
          "unexpected" → "failed"
          "flaky"      → "flaky"
          anything else (e.g. "skipped") → "skipped"
        """
        mapping = {
            "expected":   "passed",
            "unexpected": "failed",
            "flaky":      "flaky",
            "skipped":    "skipped",
        }
        return mapping.get(test.get("status", ""), "skipped")

    def _clean_ansi(self, text: str) -> str:
        """Strip ANSI escape codes from a string."""
        if not text:
            return text
        return re.sub(r'\x1b\[[0-9;]*[mGKHF]', '', text)

    def _extract_errors(self, results: list) -> tuple[str | None, list]:
        """
        Extract error_message (first message, ANSI-stripped) and
        error_details (list of {message, file, line, column} dicts)
        from all results[].errors[] and results[].error entries.
        """
        all_errors  = []
        first_msg   = None

        for result in results:
            # results[].errors[] — plural array
            for err in result.get("errors", []):
                msg = self._clean_ansi(err.get("message", ""))
                loc = err.get("location", {}) or {}
                all_errors.append({
                    "message": msg,
                    "file":    loc.get("file"),
                    "line":    loc.get("line"),
                    "column":  loc.get("column"),
                })
                if first_msg is None and msg:
                    first_msg = msg

            # results[].error — singular object
            singular = result.get("error")
            if singular:
                msg = self._clean_ansi(singular.get("message", ""))
                if first_msg is None and msg:
                    first_msg = msg

        return first_msg, all_errors
