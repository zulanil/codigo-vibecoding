import os

from django.core.wsgi import get_wsgi_application

# Auto-detect Railway: DATABASE_URL is always present in Railway deployments
if os.environ.get('DATABASE_URL') or os.environ.get('RAILWAY_PUBLIC_DOMAIN'):
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
else:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

application = get_wsgi_application()
