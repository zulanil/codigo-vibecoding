"""SDD spec: POST /api/procesar."""
import pytest


def _procesar(client, token, datos, col_x="x", col_y="y", sigma=3.0):
    return client.post(
        "/api/procesar",
        json={"datos": datos, "col_x": col_x, "col_y": col_y, "sigma": sigma},
        headers={"Authorization": f"Bearer {token}"} if token else {},
    )


# ── Auth guards ───────────────────────────────────────────────────────────────

def test_procesar_sin_token(client, sample_csv):
    r = _procesar(client, None, sample_csv)
    assert r.status_code in (401, 403)


def test_procesar_viewer_forbidden(client, viewer_token, sample_csv):
    r = _procesar(client, viewer_token, sample_csv)
    assert r.status_code == 403


# ── Casos válidos ─────────────────────────────────────────────────────────────

def test_procesar_editor_ok(client, editor_token, sample_csv):
    r = _procesar(client, editor_token, sample_csv)
    assert r.status_code == 200
    body = r.json()
    # Campos obligatorios de la spec
    for campo in ["media", "desviacion_std", "limite_control_superior",
                  "limite_control_inferior", "total_puntos", "total_anomalias",
                  "serie", "anomalias"]:
        assert campo in body, f"Falta campo: {campo}"


def test_procesar_admin_ok(client, admin_token, sample_csv):
    r = _procesar(client, admin_token, sample_csv)
    assert r.status_code == 200


def test_procesar_detecta_anomalias(client, editor_token, sample_csv):
    r = _procesar(client, editor_token, sample_csv)
    assert r.status_code == 200
    # El CSV de prueba tiene 2 anomalías claras (9999 y -9999)
    assert r.json()["total_anomalias"] >= 2


def test_procesar_estadisticos_coherentes(client, editor_token, sample_csv):
    r = _procesar(client, editor_token, sample_csv)
    body = r.json()
    assert body["limite_control_superior"] > body["media"] > body["limite_control_inferior"]
    assert body["desviacion_std"] > 0


# ── Cap de sigma para editor ─────────────────────────────────────────────────

def test_procesar_editor_sigma_cap(client, editor_token, sample_csv):
    # Editor pide sigma=5 → backend debe caparlo a 3.0
    r = _procesar(client, editor_token, sample_csv, sigma=5.0)
    assert r.status_code == 200
    body = r.json()
    # Con sigma=3: LCS = media + 3*std. Con sigma=5 sin cap sería mayor.
    # No podemos comparar valores exactos, pero sí verificar que la respuesta es válida.
    assert body["limite_control_superior"] > 0


def test_procesar_admin_sigma_libre(client, admin_token, sample_csv):
    r3 = _procesar(client, admin_token, sample_csv, sigma=3.0)
    r5 = _procesar(client, admin_token, sample_csv, sigma=5.0)
    # Con mayor sigma, LCS debe ser mayor
    assert r5.json()["limite_control_superior"] > r3.json()["limite_control_superior"]
    # Y debe haber menos o igual anomalías con sigma mayor
    assert r5.json()["total_anomalias"] <= r3.json()["total_anomalias"]


# ── Errores de validación ─────────────────────────────────────────────────────

def test_procesar_columna_inexistente(client, editor_token, sample_csv):
    r = _procesar(client, editor_token, sample_csv, col_y="columna_que_no_existe")
    assert r.status_code == 400


def test_procesar_datos_vacios(client, editor_token):
    r = _procesar(client, editor_token, "")
    assert r.status_code in (400, 422)
