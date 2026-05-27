from .base import *
import dj_database_url
from decouple import config

DEBUG = False

DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL'),
        conn_max_age=600,
    )
}

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='').split(',')

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
