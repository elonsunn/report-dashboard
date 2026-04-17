"""Root URL configuration — mounts all app routes under /api/v1/."""

from django.urls import path, include

urlpatterns = [
    path("api/v1/", include("reports.urls")),
]
