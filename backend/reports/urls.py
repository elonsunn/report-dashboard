"""URL routing for the reports app — wired to DRF APIView classes."""

from django.urls import path
from .views import (
    ProjectListView, ProjectDetailView, ProjectGenerateApiKeyView,
    ProjectTriggerJenkinsView,
    RunListView, RunLatestView, RunDetailView, RunUploadFileView,
    TestCaseListView, TestCaseDetailView,
    ProjectTrendsView, ProjectStatsView, ProjectTopFailuresView, ProjectTopFlakyView,
)

urlpatterns = [
    # --- Projects ---
    path('projects/',                                   ProjectListView.as_view(),           name='project-list'),
    path('projects/<slug:slug>/',                       ProjectDetailView.as_view(),         name='project-detail'),
    path('projects/<slug:slug>/api-key/',               ProjectGenerateApiKeyView.as_view(), name='project-api-key'),
    path('projects/<slug:slug>/trigger/',               ProjectTriggerJenkinsView.as_view(), name='project-trigger'),

    # --- Test Runs ---
    path('projects/<slug:slug>/runs/',                  RunListView.as_view(),               name='run-list'),
    path('projects/<slug:slug>/runs/latest/',           RunLatestView.as_view(),             name='run-latest'),
    path('projects/<slug:slug>/runs/<int:run_number>/', RunDetailView.as_view(),             name='run-detail'),

    # --- Test Cases ---
    path('projects/<slug:slug>/runs/<int:run_number>/cases/', TestCaseListView.as_view(),    name='test-case-list'),
    path('test-cases/<str:tc_id>/',                     TestCaseDetailView.as_view(),        name='test-case-detail'),

    # --- File Upload (web UI, no auth) ---
    path('projects/<slug:slug>/upload/',                RunUploadFileView.as_view(),         name='run-upload'),

    # --- Trends & Stats ---
    path('projects/<slug:slug>/trends/',                ProjectTrendsView.as_view(),         name='project-trends'),
    path('projects/<slug:slug>/stats/',                 ProjectStatsView.as_view(),          name='project-stats'),
    path('projects/<slug:slug>/top-failures/',          ProjectTopFailuresView.as_view(),    name='project-top-failures'),
    path('projects/<slug:slug>/top-flaky/',             ProjectTopFlakyView.as_view(),       name='project-top-flaky'),
]
