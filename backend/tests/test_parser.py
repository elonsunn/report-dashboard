"""
Tests for PlaywrightReportParser.

Run with:
    cd backend
    python -m pytest tests/test_parser.py -v
"""

import json
import os
import sys
import pytest

# Allow importing from backend root without installing the package
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from reports.parser import PlaywrightReportParser

FIXTURE_PATH = os.path.join(
    os.path.dirname(__file__), "fixtures", "sample_report.json"
)


@pytest.fixture(scope="module")
def parsed():
    with open(FIXTURE_PATH, encoding="utf-8") as f:
        data = json.load(f)
    parser = PlaywrightReportParser(data)
    return parser.parse()


# ---------------------------------------------------------------------------
# test_cases list
# ---------------------------------------------------------------------------

class TestTestCases:
    def test_total_count(self, parsed):
        """Parser must extract all 17 specs from nested suites."""
        assert len(parsed["test_cases"]) == 17

    def test_all_have_required_fields(self, parsed):
        required = {"title", "status", "file_path", "suite_title"}
        for tc in parsed["test_cases"]:
            missing = required - set(tc.keys())
            assert not missing, f"Test case missing fields {missing}: {tc['title']}"

    def test_status_values_valid(self, parsed):
        valid = {"passed", "failed", "flaky", "skipped"}
        for tc in parsed["test_cases"]:
            assert tc["status"] in valid, f"Invalid status: {tc['status']}"

    def test_passed_count(self, parsed):
        passed = [tc for tc in parsed["test_cases"] if tc["status"] == "passed"]
        assert len(passed) == 16

    def test_failed_count(self, parsed):
        failed = [tc for tc in parsed["test_cases"] if tc["status"] == "failed"]
        assert len(failed) == 1

    def test_tags_extracted(self, parsed):
        # The DB-1219 suite specs have ['db-baldwin', 'regression', '26.1.2', 'smoke']
        tagged = [tc for tc in parsed["test_cases"] if "regression" in tc.get("tags", [])]
        assert len(tagged) == 3, "Expected 3 specs with 'regression' tag"

    def test_suite_title_assigned(self, parsed):
        # All test cases must have a non-empty suite_title
        for tc in parsed["test_cases"]:
            assert tc["suite_title"], f"Empty suite_title for: {tc['title']}"

    def test_project_name_extracted(self, parsed):
        # All test cases should have a projectName
        for tc in parsed["test_cases"]:
            assert tc["project_name"], f"Missing project_name for: {tc['title']}"


# ---------------------------------------------------------------------------
# Failed test specifics
# ---------------------------------------------------------------------------

class TestFailedTest:
    @pytest.fixture(scope="class")
    def failed_tc(self, parsed):
        failed = [tc for tc in parsed["test_cases"] if tc["status"] == "failed"]
        assert len(failed) == 1
        return failed[0]

    def test_failed_title(self, failed_tc):
        assert "Complete Policy Review" in failed_tc["title"]

    def test_retry_count(self, failed_tc):
        """Failed test was retried once — retry_count should be 1."""
        assert failed_tc["retry_count"] == 1

    def test_error_message_no_ansi(self, failed_tc):
        """Error messages must have ANSI escape codes stripped."""
        msg = failed_tc.get("error_message", "")
        assert msg, "Failed test should have an error_message"
        assert "\x1b[" not in msg, f"ANSI codes found in error_message: {msg[:100]}"
        assert "\u001b[" not in msg, f"ANSI codes found in error_message: {msg[:100]}"

    def test_error_details_no_ansi(self, failed_tc):
        for detail in failed_tc.get("error_details", []):
            msg = detail.get("message", "")
            assert "\x1b[" not in msg, f"ANSI codes in error detail: {msg[:100]}"

    def test_has_retry_results(self, failed_tc):
        """Retry details list should contain multiple attempt records."""
        assert len(failed_tc["results"]) > 1

    def test_retry_index_values(self, failed_tc):
        """results[n].retry should reflect the attempt index."""
        retries = {r["retry"] for r in failed_tc["results"]}
        assert 0 in retries, "First attempt (retry=0) should be present"
        assert 1 in retries, "First retry (retry=1) should be present"


# ---------------------------------------------------------------------------
# Run info
# ---------------------------------------------------------------------------

class TestRunInfo:
    def test_summary_totals(self, parsed):
        s = parsed["run_info"]["summary"]
        assert s["total"] == 17
        assert s["passed"] == 16
        assert s["failed"] == 1
        assert s["flaky"] == 0
        assert s["skipped"] == 0

    def test_pass_rate(self, parsed):
        rate = parsed["run_info"]["summary"]["pass_rate"]
        expected = round(16 / 17 * 100, 2)
        assert rate == expected

    def test_duration(self, parsed):
        assert parsed["run_info"]["duration"] == pytest.approx(824354.984)

    def test_started_at_is_datetime(self, parsed):
        from datetime import datetime
        assert isinstance(parsed["run_info"]["started_at"], datetime)

    def test_environment(self, parsed):
        env = parsed["run_info"]["environment"]
        assert env["playwright_version"] is not None

    def test_ci_info_fields_present(self, parsed):
        ci = parsed["run_info"]["ci_info"]
        # At least branch should be present
        assert ci.get("branch") is not None
