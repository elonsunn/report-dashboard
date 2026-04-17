"""
DRF authentication and permission classes for API key access.

Clients must send the key in one of:
  Authorization: Bearer rpt_xxxxx
  X-API-Key: rpt_xxxxx

Usage in a view:
    class MyView(APIView):
        authentication_classes = [ApiKeyAuthentication]
        permission_classes     = [IsAuthenticated]
"""

from rest_framework.authentication import BaseAuthentication
from rest_framework.permissions import BasePermission
from rest_framework.exceptions import AuthenticationFailed

from .services import get_project_by_api_key


def _extract_key(request) -> str | None:
    """Extract API key from request headers (works with both Django and DRF requests)."""
    # Support both DRF's request.META and plain Django request.META
    meta = getattr(request, '_request', request).META

    # Authorization: Bearer rpt_xxx
    auth = meta.get('HTTP_AUTHORIZATION', '')
    if auth.startswith('Bearer '):
        key = auth[7:].strip()
        if key:
            return key

    # X-API-Key: rpt_xxx
    key = meta.get('HTTP_X_API_KEY', '').strip()
    if key:
        return key

    return None


class ApiKeyAuthentication(BaseAuthentication):
    """
    Authenticates requests by matching the API key to a Project document.
    Sets request.user = Project instance and request.auth = the raw key string.
    Returns None (anonymous) when no key is present — views can decide
    whether to allow unauthenticated access via their permission_classes.
    """

    def authenticate(self, request):
        key = _extract_key(request)
        if not key:
            return None  # No credentials — let permission class decide

        project = get_project_by_api_key(key)
        if not project:
            raise AuthenticationFailed('Invalid API key.')

        return (project, key)  # (user, auth_token)

    def authenticate_header(self, request):
        return 'Bearer realm="API key required"'


class IsAuthenticated(BasePermission):
    """Requires a valid API key (any project)."""

    def has_permission(self, request, view):
        return request.user is not None


class IsProjectAuthenticated(BasePermission):
    """
    Requires a valid API key that belongs to the project in the URL.
    The view must set self.project before DRF calls has_permission.
    """

    def has_permission(self, request, view):
        if request.user is None:
            return False
        # view.project is set by the view's get_project() helper
        project = getattr(view, 'project', None)
        if project is None:
            return True  # project not resolved yet; let the view handle 404
        return str(request.user.id) == str(project.id)
