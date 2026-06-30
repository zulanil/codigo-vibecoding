"""SDD spec: POST /api/auth/login · /register · GET /api/auth/me · /users · PATCH role."""
import pytest


# ── POST /api/auth/login ─────────────────────────────────────────────────────

def test_login_admin_ok(client):
    r = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "admin123"})
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert body["user"]["role"] == "admin"


def test_login_editor_ok(client):
    r = client.post("/api/auth/login", json={"email": "editor@test.com", "password": "editor123"})
    assert r.status_code == 200
    assert r.json()["user"]["role"] == "editor"


def test_login_wrong_password(client):
    r = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "wrong"})
    assert r.status_code == 401


def test_login_unknown_email(client):
    r = client.post("/api/auth/login", json={"email": "no@existe.com", "password": "123"})
    assert r.status_code == 401


# ── POST /api/auth/register ──────────────────────────────────────────────────

def test_register_nuevo_usuario(client):
    r = client.post("/api/auth/register", json={
        "email": "nuevo@test.com", "name": "Nuevo", "password": "pass123", "role": "viewer"
    })
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body
    assert body["user"]["email"] == "nuevo@test.com"


def test_register_email_duplicado(client):
    payload = {"email": "admin@test.com", "name": "Dup", "password": "abc123", "role": "viewer"}
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 400


# ── GET /api/auth/me ─────────────────────────────────────────────────────────

def test_me_sin_token(client):
    r = client.get("/api/auth/me")
    assert r.status_code in (401, 403)   # HTTPBearer devuelve 401 en Starlette reciente


def test_me_con_token(client, editor_token):
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {editor_token}"})
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == "editor@test.com"
    assert body["role"] == "editor"


def test_me_token_invalido(client):
    r = client.get("/api/auth/me", headers={"Authorization": "Bearer token_falso"})
    assert r.status_code == 401


# ── GET /api/auth/users [Admin only] ─────────────────────────────────────────

def test_list_users_admin(client, admin_token):
    r = client.get("/api/auth/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) >= 3


def test_list_users_editor_forbidden(client, editor_token):
    r = client.get("/api/auth/users", headers={"Authorization": f"Bearer {editor_token}"})
    assert r.status_code == 403


# ── PATCH /api/auth/users/{id}/role [Admin only] ─────────────────────────────

def test_change_role_admin(client, admin_token):
    # Usa roletest@test.com — usuario dedicado para no corromper viewer_token fixture
    users = client.get("/api/auth/users", headers={"Authorization": f"Bearer {admin_token}"}).json()
    target = next(u for u in users if u["email"] == "roletest@test.com")
    r = client.patch(
        f"/api/auth/users/{target['id']}/role",
        json={"role": "editor"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200
    assert r.json()["role"] == "editor"


def test_change_role_rol_invalido(client, admin_token):
    users = client.get("/api/auth/users", headers={"Authorization": f"Bearer {admin_token}"}).json()
    r = client.patch(
        f"/api/auth/users/{users[0]['id']}/role",
        json={"role": "superusuario"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 400
