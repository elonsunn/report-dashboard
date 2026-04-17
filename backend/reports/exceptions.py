"""
Custom DRF exception handler — normalises all error responses to
{"error": "message"} to maintain a consistent API contract.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response


def drf_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        # DRF returns {"detail": "..."} by default; remap to {"error": "..."}
        detail = response.data.get('detail', str(exc))
        response.data = {'error': str(detail)}

    return response
