"""SDD spec: POST /api/limpiar."""
from io import BytesIO


def _upload(client, token, csv_text, filename="datos.csv"):
    return client.post(
        "/api/limpiar",
        files={"archivo": (filename, BytesIO(csv_text.encode()), "text/csv")},
        headers={"Authorization": f"Bearer {token}"} if token else {},
    )


# ── Auth guards ───────────────────────────────────────────────────────────────

def test_limpiar_sin_token(client, sample_csv):
    r = _upload(client, None, sample_csv)
    assert r.status_code in (401, 403)


def test_limpiar_viewer_forbidden(client, viewer_token, sample_csv):
    r = _upload(client, viewer_token, sample_csv)
    assert r.status_code == 403


# ── Casos válidos ─────────────────────────────────────────────────────────────

def test_limpiar_editor_csv_valido(client, editor_token, sample_csv):
    r = _upload(client, editor_token, sample_csv)
    assert r.status_code == 200
    body = r.json()
    assert "columnas" in body
    assert "x" in body["columnas"]
    assert "y" in body["columnas"]
    assert "preview" in body
    assert "datos_limpios" in body
    assert body["filas"] > 0


def test_limpiar_admin_csv_valido(client, admin_token, sample_csv):
    r = _upload(client, admin_token, sample_csv)
    assert r.status_code == 200


def test_limpiar_csv_con_semicolons(client, editor_token):
    csv_sc = "a;b;c\n1;2;3\n4;5;6\n4;5;6"  # punto y coma + duplicado
    r = _upload(client, editor_token, csv_sc)
    assert r.status_code == 200
    body = r.json()
    assert body["filas"] == 2  # duplicado eliminado


def test_limpiar_preview_max_10_filas(client, editor_token):
    # 25 filas únicas
    csv_big = "x,y\n" + "\n".join(f"{i},{i*10}" for i in range(25))
    r = _upload(client, editor_token, csv_big)
    assert r.status_code == 200
    assert len(r.json()["preview"]) <= 10
