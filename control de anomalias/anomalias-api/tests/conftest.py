"""
SDD (Spec-Driven Development) — fixtures compartidos.
Usa SQLite en memoria para no depender de Neon en los tests.
"""
import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# ── Test DB (SQLite en memoria) ──────────────────────────────────────────────
TEST_DB = "sqlite:///./test_anomalias.db"
engine_test = create_engine(TEST_DB, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)

# ── Override get_db ANTES de importar app ────────────────────────────────────
from database import Base, get_db  # noqa: E402
from main import app               # noqa: E402
from models import User            # noqa: E402
from auth.jwt import hash_password  # noqa: E402

def _test_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = _test_get_db

# ── CSV mínimo con 2 anomalías claras ────────────────────────────────────────
SAMPLE_CSV = "\n".join(
    ["x,y"]
    + [f"{i},{100 + i}" for i in range(20)]   # puntos normales
    + ["20,9999", "21,-9999"]                  # anomalías claras
)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    """Crea tablas + usuarios de prueba en SQLite."""
    Base.metadata.create_all(bind=engine_test)
    db = TestSession()
    db.add_all([
        User(email="admin@test.com",    name="Admin",    hashed_password=hash_password("admin123"),    role="admin"),
        User(email="editor@test.com",   name="Editor",   hashed_password=hash_password("editor123"),   role="editor"),
        User(email="viewer@test.com",   name="Viewer",   hashed_password=hash_password("viewer123"),   role="viewer"),
        # Usuario dedicado para tests de cambio de rol — nunca usado como fixture de auth
        User(email="roletest@test.com", name="RoleTest", hashed_password=hash_password("role123"),     role="viewer"),
    ])
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine_test)
    engine_test.dispose()   # libera lock de SQLite en Windows
    try:
        if os.path.exists("test_anomalias.db"):
            os.remove("test_anomalias.db")
    except PermissionError:
        pass  # Windows puede mantener el lock brevemente; no bloquear la suite


@pytest.fixture(scope="session")
def client():
    from fastapi.testclient import TestClient
    return TestClient(app, raise_server_exceptions=True)


@pytest.fixture(scope="session")
def admin_token(client):
    r = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "admin123"})
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def editor_token(client):
    r = client.post("/api/auth/login", json={"email": "editor@test.com", "password": "editor123"})
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def viewer_token(client):
    r = client.post("/api/auth/login", json={"email": "viewer@test.com", "password": "viewer123"})
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def sample_csv():
    return SAMPLE_CSV
