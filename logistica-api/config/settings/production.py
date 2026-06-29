from .base import *
import json
from datetime import timedelta
import dj_database_url
from decouple import config
from google.oauth2 import service_account

DEBUG = False

RAILWAY_DOMAIN = config('RAILWAY_PUBLIC_DOMAIN', default='')
if RAILWAY_DOMAIN:
    ALLOWED_HOSTS.append(RAILWAY_DOMAIN)
    CSRF_TRUSTED_ORIGINS = [f'https://{RAILWAY_DOMAIN}']
    

DATABASE_URL = config('DATABASE_URL', default=None)

if not DATABASE_URL:
    raise Exception("DATABASE_URL no está configurada en Railway")

DATABASES = {
    'default': dj_database_url.parse(
        DATABASE_URL,
        conn_max_age=600,
        ssl_require=True
    )
}
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

_cors_origins = config('CORS_ALLOWED_ORIGINS', default='')
CORS_ALLOWED_ORIGINS = [o for o in _cors_origins.split(',') if o]

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://logistica-fronted.*\.vercel\.app$",
]

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

_gcs_creds_json = config('GCS_CREDENTIALS', default=None)
if _gcs_creds_json:
    _creds_info = json.loads(_gcs_creds_json)
    GS_CREDENTIALS = service_account.Credentials.from_service_account_info(_creds_info)

GS_BUCKET_NAME = config('GCS_BUCKET', default='logista-media')
GS_FILE_OVERWRITE = False
GS_DEFAULT_ACL = None
GS_QUERYSTRING_AUTH = True
GS_EXPIRATION = timedelta(hours=1)

STORAGES = {
    'default': {
        'BACKEND': 'storages.backends.gcloud.GoogleCloudStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

