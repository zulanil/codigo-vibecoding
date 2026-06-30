from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from analytics import limpiar_datos, calcular_anomalias_shewhart
from database import engine, SessionLocal, get_db
from sqlalchemy.orm import Session
from models import Base, User, Analysis
from auth.router import router as auth_router
from reports.router import router as reports_router
from auth.dependencies import get_current_user, require_role
from auth.jwt import hash_password

app = FastAPI(title="Control de Anomalías API", version="2.0.0")

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(reports_router)


# ── Startup: crear tablas + seed usuarios demo ────────────────────────────────
SEED_USERS = [
    ("admin@anomalias.com",   "Administrador",    "Admin2024!",   "admin"),
    ("editor1@anomalias.com", "Editor Uno",       "Editor2024!",  "editor"),
    ("editor2@anomalias.com", "Editor Dos",       "Editor2024!",  "editor"),
    ("viewer1@anomalias.com", "Visualizador Uno", "Viewer2024!",  "viewer"),
    ("viewer2@anomalias.com", "Visualizador Dos", "Viewer2024!",  "viewer"),
]


def _upsert_user(db, email, name, password, role):
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.name = name
        user.hashed_password = hash_password(password)
        user.role = role
    else:
        db.add(User(email=email, name=name, hashed_password=hash_password(password), role=role))


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        for email, name, pwd, role in SEED_USERS:
            _upsert_user(db, email, name, pwd, role)
        db.commit()
        print("✅ Usuarios demo sincronizados")
    finally:
        db.close()


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"estado": "ok", "docs": "/docs", "version": "2.0.0"}


# ── Schemas ───────────────────────────────────────────────────────────────────
class ProcesarRequest(BaseModel):
    datos: str
    col_x: str
    col_y: str
    sigma: float = 3.0


# ── Endpoints análisis ────────────────────────────────────────────────────────
@app.post("/api/limpiar", summary="Limpia CSV · admin + editor")
async def limpiar(
    archivo: UploadFile = File(...),
    current_user: User = Depends(require_role("admin", "editor")),
):
    contenido = await archivo.read()
    try:
        texto = contenido.decode("utf-8")
    except UnicodeDecodeError:
        texto = contenido.decode("latin-1")

    try:
        df = limpiar_datos(texto)
    except Exception as e:
        raise HTTPException(422, f"Error al parsear CSV: {e}")

    return {
        "columnas": list(df.columns),
        "filas": len(df),
        "preview": df.head(10).to_dict(orient="records"),
        "datos_limpios": df.to_csv(index=False),
    }


@app.post("/api/procesar", summary="Shewhart · admin + editor")
def procesar(
    body: ProcesarRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "editor")),
):
    try:
        df = limpiar_datos(body.datos)
    except Exception as e:
        raise HTTPException(422, f"Error al parsear datos: {e}")

    if body.col_x not in df.columns or body.col_y not in df.columns:
        raise HTTPException(400, f"Columnas no encontradas. Disponibles: {list(df.columns)}")

    sigma = body.sigma if current_user.role == "admin" else min(body.sigma, 3.0)

    try:
        resultado = calcular_anomalias_shewhart(df, body.col_x, body.col_y, sigma)
    except Exception as e:
        raise HTTPException(500, f"Error en cálculo: {e}")

    # Persistir metadatos en Neon
    try:
        audit = Analysis(
            user_id=current_user.id,
            col_x=body.col_x,
            col_y=body.col_y,
            sigma=sigma,
            total_puntos=resultado["total_puntos"],
            total_anomalias=resultado["total_anomalias"],
            puntos_display=resultado["puntos_display"],
            downsampled=resultado["downsampled"],
            media=resultado["media"],
            lcs=resultado["limite_control_superior"],
            lci=resultado["limite_control_inferior"],
        )
        db.add(audit)
        db.commit()
    except Exception:
        db.rollback()  # no fallar la respuesta por error de auditoría

    return resultado
