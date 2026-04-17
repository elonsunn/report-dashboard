"""
Django settings for report_dashboard project.

Pure API-only Django project backed by PostgreSQL.
No admin, no sessions — just REST API endpoints.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-3yjvm+gr@rkvywtbojmy_pov1aqzr(2nhx7m!7qp_+z&27c8d!'
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1,192.168.29.57').split(',')


# Application definition
INSTALLED_APPS = [
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.postgres',
    'corsheaders',
    'rest_framework',
    'reports',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # CorsMiddleware must come before CommonMiddleware
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'report_dashboard.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
            ],
        },
    },
]

WSGI_APPLICATION = 'report_dashboard.wsgi.application'


# PostgreSQL database
DATABASES = {
    'default': {
        'ENGINE':   'django.db.backends.postgresql',
        'NAME':     os.environ.get('POSTGRES_DB',       'report_dashboard'),
        'USER':     os.environ.get('POSTGRES_USER',     'postgres'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD', ''),
        'HOST':     os.environ.get('POSTGRES_HOST',     'localhost'),
        'PORT':     os.environ.get('POSTGRES_PORT',     '5432'),
    }
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# CORS configuration — allow the Vite dev server to reach this API
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

# In production, also allow the deployed frontend domain
CORS_ALLOWED_ORIGIN_REGEXES = []

# Allow credentials (cookies) if needed in the future
CORS_ALLOW_CREDENTIALS = True


# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# Static files
STATIC_URL = 'static/'


# Django REST Framework
REST_FRAMEWORK = {
    # All endpoints return JSON; BrowsableAPI is disabled (it needs django.contrib.auth)
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    # No global authentication — individual views opt in via authentication_classes
    'DEFAULT_AUTHENTICATION_CLASSES': [],
    'DEFAULT_PERMISSION_CLASSES': [],
    # No AnonymousUser — we don't have django.contrib.auth installed
    'UNAUTHENTICATED_USER': None,
    # Consistent {"error": "..."} response format
    'EXCEPTION_HANDLER': 'reports.exceptions.drf_exception_handler',
}
