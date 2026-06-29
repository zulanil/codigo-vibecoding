# Image Upload — Guía para Frontend

## Contexto

El endpoint de productos ahora soporta imágenes almacenadas en Google Cloud Storage.
Las imágenes son **opcionales** — un producto puede existir sin imagen.

---

## Qué cambió en los endpoints existentes

### `GET /api/v1/products/` y `GET /api/v1/products/{id}/`

El response ahora incluye el campo `image`:

```json
{
  "id": 1,
  "supplier": 3,
  "name": "MacBook Pro 14",
  "sku": "MBP-14-M3",
  "description": "Laptop profesional Apple",
  "weight_kg": "1.600",
  "length_cm": "31.26",
  "width_cm": "22.12",
  "height_cm": "1.55",
  "unit_price": "1999.00",
  "image": "https://storage.googleapis.com/logista-media/products/macbook.jpg?X-Goog-Signature=...",
  "created_at": "2026-06-29T10:00:00Z",
  "updated_at": "2026-06-29T10:00:00Z"
}
```

**Comportamiento del campo `image`:**
- `null` — el producto no tiene imagen cargada
- `string` (URL) — URL firmada de GCS, **válida por 1 hora**
- Las URLs expiran — no cachear permanentemente, siempre usar la URL del response más reciente

---

## Nuevo endpoint: subir imagen

### `POST /api/v1/products/{id}/upload-image/`

Sube o reemplaza la imagen de un producto existente.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (form-data):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `image` | file | Sí | Archivo de imagen (JPG, PNG, WEBP) |

**Ejemplo con fetch:**
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch(`/api/v1/products/${productId}/upload-image/`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    // NO incluir Content-Type — el browser lo setea automáticamente con el boundary
  },
  body: formData,
});

const product = await response.json();
console.log(product.image); // URL firmada de GCS
```

**Response exitoso — 200 OK:**
```json
{
  "id": 1,
  "supplier": 3,
  "name": "MacBook Pro 14",
  "sku": "MBP-14-M3",
  "image": "https://storage.googleapis.com/logista-media/products/macbook.jpg?X-Goog-Signature=...",
  ...
}
```

**Response de error — 400 Bad Request:**
```json
{
  "error": "No image file provided."
}
```

---

## Flujo recomendado

```
1. Crear producto → POST /api/v1/products/       (JSON, sin imagen)
2. Subir imagen  → POST /api/v1/products/{id}/upload-image/  (multipart/form-data)
3. Mostrar imagen → usar product.image del response (URL firmada)
```

Separar creación de producto y upload de imagen simplifica el manejo de errores — si el upload falla, el producto ya existe y se puede reintentar.

---

## Consideraciones de UI

- **Placeholder:** mostrar imagen genérica cuando `image === null`
- **URLs firmadas expiran en 1h** — para mostrar la imagen, siempre hacer `GET /products/{id}/` para obtener URL fresca si el usuario lleva más de 1h en la sesión
- **Formatos aceptados:** JPG, PNG, WEBP (validado por Pillow en el backend)
- **Sin límite de tamaño configurado actualmente** — en producción se recomienda validar en el frontend antes de subir (max ~5MB)
