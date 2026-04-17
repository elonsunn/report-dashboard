"""
API views — Django REST Framework APIView classes.
All responses use DRF's Response with JSONRenderer.
"""

import json

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Project, TestRun, TestCase
from . import services, serializers
from .api_auth import ApiKeyAuthentication, IsAuthenticated, IsProjectAuthenticated
from .parser import PlaywrightReportParser


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _decode_json_bytes(data: bytes) -> dict:
    """
    Decode raw bytes to a JSON dict, handling UTF-8, UTF-16 LE/BE, and BOM variants.
    Playwright on Windows often writes results.json as UTF-16 LE with BOM.
    """
    if data[:2] in (b'\xff\xfe', b'\xfe\xff'):
        return json.loads(data.decode('utf-16'))
    if data[:3] == b'\xef\xbb\xbf':
        return json.loads(data[3:].decode('utf-8'))
    return json.loads(data.decode('utf-8'))


def _upload_report(request, project):
    """Parse and persist a Playwright JSON report. Returns a DRF Response."""
    content_type = request.content_type or ''

    if 'multipart' in content_type:
        # Web UI file upload — read from request.FILES
        uploaded = request.FILES.get('file') or request.FILES.get('report')
        if not uploaded:
            return Response(
                {'error': "No file provided. Send file as 'file' field."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            raw = _decode_json_bytes(uploaded.read())
        except (json.JSONDecodeError, ValueError, UnicodeDecodeError) as e:
            return Response(
                {'error': f'Invalid JSON file: {e}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
    else:
        # CI/CD programmatic upload — body is raw JSON
        raw = request.data  # DRF already parsed it via JSONParser
        if not isinstance(raw, dict):
            return Response(
                {'error': 'Request body must be a JSON object.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

    try:
        parsed = PlaywrightReportParser(raw).parse()
    except Exception as e:
        return Response({'error': f'Parse error: {e}'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    try:
        run = services.create_test_run(project, parsed)
    except Exception as e:
        import traceback
        return Response({'error': f'Storage error: {e}', 'detail': traceback.format_exc()}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({
        'run_id':     str(run.id),
        'run_number': run.run_number,
        'summary':    serializers.serialize_run(run)['summary'],
        'url':        f'/projects/{project.slug}/runs/{run.run_number}/',
    }, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------

class ProjectListView(APIView):
    """GET /projects/  — list all projects
       POST /projects/ — create a project"""

    def get(self, request):
        items = services.list_projects()
        data = [
            serializers.serialize_project(item['project'], item['latest_run'])
            for item in items
        ]
        return Response({'projects': data})

    def post(self, request):
        name = (request.data.get('name') or '').strip()
        if not name:
            return Response(
                {'error': "'name' is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        description = (request.data.get('description') or '').strip()
        project = services.create_project(name, description)
        return Response(serializers.serialize_project(project), status=status.HTTP_201_CREATED)


class ProjectDetailView(APIView):
    """GET /projects/{slug}/    — retrieve
       PUT /projects/{slug}/    — update
       DELETE /projects/{slug}/ — delete"""

    def _get_project(self, slug):
        try:
            return services.get_project_by_slug(slug), None
        except Project.DoesNotExist:
            return None, Response(
                {'error': f"Project '{slug}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

    def get(self, request, slug):
        project, err = self._get_project(slug)
        if err:
            return err
        latest = services.get_latest_run(project)
        return Response(serializers.serialize_project(project, latest))

    def put(self, request, slug):
        project, err = self._get_project(slug)
        if err:
            return err
        project = services.update_project(
            slug,
            name=request.data.get('name'),
            description=request.data.get('description'),
        )
        return Response(serializers.serialize_project(project))

    def delete(self, request, slug):
        project, err = self._get_project(slug)
        if err:
            return err
        services.delete_project(slug)
        return Response({'message': 'Project deleted.'})


class ProjectGenerateApiKeyView(APIView):
    """POST /projects/{slug}/api-key/ — generate or regenerate API key"""

    def post(self, request, slug):
        try:
            key = services.generate_api_key(slug)
        except Project.DoesNotExist:
            return Response(
                {'error': f"Project '{slug}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({'api_key': key})


# ---------------------------------------------------------------------------
# Test Runs
# ---------------------------------------------------------------------------

class RunListView(APIView):
    """GET  /projects/{slug}/runs/ — list runs (paginated)
       POST /projects/{slug}/runs/ — upload report (API key required)"""

    # Authentication is opt-in per method — checked manually in post()
    authentication_classes = [ApiKeyAuthentication]

    def _get_project(self, slug):
        try:
            return services.get_project_by_slug(slug), None
        except Project.DoesNotExist:
            return None, Response(
                {'error': f"Project '{slug}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

    def get(self, request, slug):
        project, err = self._get_project(slug)
        if err:
            return err
        page     = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 20))
        runs, total = services.list_test_runs(project, page, per_page)
        return Response({
            'runs':     [serializers.serialize_run_summary(r) for r in runs],
            'total':    total,
            'page':     page,
            'per_page': per_page,
        })

    def post(self, request, slug):
        project, err = self._get_project(slug)
        if err:
            return err

        # Enforce API key auth for programmatic uploads
        if request.user is None:
            return Response(
                {'error': 'API key required. Use Authorization: Bearer rpt_xxx or X-API-Key header.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        # Verify the key belongs to this specific project
        if str(request.user.id) != str(project.id):
            return Response(
                {'error': 'Invalid API key for this project.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return _upload_report(request, project)


class RunUploadFileView(APIView):
    """POST /projects/{slug}/upload/ — web UI file upload, no API key required"""

    def post(self, request, slug):
        try:
            project = services.get_project_by_slug(slug)
        except Project.DoesNotExist:
            return Response(
                {'error': f"Project '{slug}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return _upload_report(request, project)


class RunLatestView(APIView):
    """GET /projects/{slug}/runs/latest/"""

    def get(self, request, slug):
        try:
            project = services.get_project_by_slug(slug)
        except Project.DoesNotExist:
            return Response(
                {'error': f"Project '{slug}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        run = services.get_latest_run(project)
        return Response({'run': serializers.serialize_run(run) if run else None})


class RunDetailView(APIView):
    """GET    /projects/{slug}/runs/{run_number}/ — retrieve run
       DELETE /projects/{slug}/runs/{run_number}/ — delete run and all its test cases"""

    def _get_run(self, slug, run_number):
        try:
            project = services.get_project_by_slug(slug)
            run = services.get_test_run(project, int(run_number))
            return project, run, None
        except Project.DoesNotExist:
            return None, None, Response(
                {'error': f"Project '{slug}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except TestRun.DoesNotExist:
            return None, None, Response(
                {'error': f'Run #{run_number} not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

    def get(self, request, slug, run_number):
        _, run, err = self._get_run(slug, run_number)
        if err:
            return err
        return Response({'run': serializers.serialize_run(run)})

    def delete(self, request, slug, run_number):
        project, _, err = self._get_run(slug, run_number)
        if err:
            return err
        services.delete_test_run(project, int(run_number))
        return Response({'message': f'Run #{run_number} deleted.'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Test Cases
# ---------------------------------------------------------------------------

class TestCaseListView(APIView):
    """GET /projects/{slug}/runs/{run_number}/cases/"""

    def get(self, request, slug, run_number):
        try:
            project = services.get_project_by_slug(slug)
            run = services.get_test_run(project, int(run_number))
        except (Project.DoesNotExist, TestRun.DoesNotExist):
            return Response({'error': 'Run not found.'}, status=status.HTTP_404_NOT_FOUND)

        status_filter = request.query_params.get('status')
        search        = request.query_params.get('search')
        cases = services.list_test_cases(run, status_filter, search)
        return Response({
            'test_cases': [serializers.serialize_test_case(tc) for tc in cases],
            'total':      cases.count(),
        })


class TestCaseDetailView(APIView):
    """GET /test-cases/{id}/"""

    def get(self, request, tc_id):
        try:
            tc = services.get_test_case(tc_id)
        except TestCase.DoesNotExist:
            return Response(
                {'error': f"TestCase '{tc_id}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({'test_case': serializers.serialize_test_case(tc)})


# ---------------------------------------------------------------------------
# Trends & Stats
# ---------------------------------------------------------------------------

class ProjectTrendsView(APIView):
    """GET /projects/{slug}/trends/"""

    def get(self, request, slug):
        try:
            project = services.get_project_by_slug(slug)
        except Project.DoesNotExist:
            return Response(
                {'error': f"Project '{slug}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            limit = int(request.query_params.get('limit', 30))
        except ValueError:
            limit = 30
        runs = services.get_run_trends(project, limit)
        return Response({'trends': [serializers.serialize_run_summary(r) for r in runs]})


class ProjectStatsView(APIView):
    """GET /projects/{slug}/stats/"""

    def get(self, request, slug):
        try:
            project = services.get_project_by_slug(slug)
        except Project.DoesNotExist:
            return Response(
                {'error': f"Project '{slug}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        _, total_runs = services.list_test_runs(project, page=1, per_page=1)
        latest = services.get_latest_run(project)
        return Response({
            'project':    serializers.serialize_project(project),
            'total_runs': total_runs,
            'latest_run': serializers.serialize_run(latest) if latest else None,
        })


class ProjectTopFailuresView(APIView):
    """GET /projects/{slug}/top-failures/"""

    def get(self, request, slug):
        try:
            project = services.get_project_by_slug(slug)
        except Project.DoesNotExist:
            return Response(
                {'error': f"Project '{slug}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        limit = int(request.query_params.get('limit', 10))
        tests = services.get_top_failing_tests(project, limit)
        return Response({
            'top_failures': [
                {'title': t['title'], 'count': t['count'], 'file_path': t.get('file_path')}
                for t in tests
            ]
        })


class ProjectTopFlakyView(APIView):
    """GET /projects/{slug}/top-flaky/"""

    def get(self, request, slug):
        try:
            project = services.get_project_by_slug(slug)
        except Project.DoesNotExist:
            return Response(
                {'error': f"Project '{slug}' not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        limit = int(request.query_params.get('limit', 10))
        tests = services.get_flaky_tests(project, limit)
        return Response({
            'top_flaky': [
                {'title': t['title'], 'count': t['count'], 'file_path': t.get('file_path')}
                for t in tests
            ]
        })
