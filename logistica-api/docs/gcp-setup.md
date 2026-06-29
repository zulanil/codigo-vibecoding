# GCP Setup — logista-cloud

## Estado: EN PROGRESO

## Proyecto GCP

| Campo | Valor |
|-------|-------|
| Project ID | `logista-cloud` |
| Project Number | `903653679253` |
| Billing Account | `010E12-126827-C31514` (vinculado desde "My First Project") |
| Región | `us-central1` |

## APIs habilitadas

- `storage.googleapis.com`
- `iam.googleapis.com`
- `iamcredentials.googleapis.com`

## Recursos creados

### Bucket
| Campo | Valor |
|-------|-------|
| Nombre | `gs://logista-media` |
| Región | `us-central1` |
| Acceso | Privado (uniform bucket-level access) |
| Estructura prevista | `products/`, `shipments/`, `drivers/`, `deliveries/` |

### Service Account
| Campo | Valor |
|-------|-------|
| Nombre | `logista-storage-sa` |
| Email | `logista-storage-sa@logista-cloud.iam.gserviceaccount.com` |
| Rol en bucket | `roles/storage.objectAdmin` |
| Rol en proyecto | `roles/iam.serviceAccountTokenCreator` (para signed URLs) |

## Pendiente

- [ ] Generar JSON key del service account
- [ ] Configurar variables de entorno en Django (`GCS_BUCKET`, `GCS_CREDENTIALS`)
- [ ] Instalar `django-storages[google]` + `google-cloud-storage`
- [ ] Configurar `DEFAULT_FILE_STORAGE` en `settings/production.py`
- [ ] Crear carpetas base en bucket (`products/`, `shipments/`, `drivers/`, `deliveries/`)
- [ ] Habilitar APIs restantes si se despliega en Cloud Run:
  - `run.googleapis.com`
  - `sqladmin.googleapis.com`
  - `artifactregistry.googleapis.com`
  - `cloudbuild.googleapis.com`
  - `secretmanager.googleapis.com`

## Decisiones tomadas

- Acceso **privado** — archivos solo accesibles via signed URLs temporales
- Upload desde **backend y frontend** (Django genera signed URLs para frontend)
- Un solo bucket con prefijos por tipo de contenido
