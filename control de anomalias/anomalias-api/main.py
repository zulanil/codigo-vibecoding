from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from analytics import limpiar_datos, calcular_anomalias_shewhart
from database import engine, SessionLocal, get_db
from sqlalchemy.orm import Session
from models import Base, User, Analysis
from auth.router import router as auth_router
from auth.dependencies import get_current_user, require_role
from auth.jwt import hash_password

app = FastAPI(title="Control de Anomalías API", version="2.0.0")

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://anomalias-front.vercel.app",
        "https://anomalias-front-8astle3ho-zulanils-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auth router ───────────────────────────────────────────────────────────────
app.include_router(auth_router)


# ── Startup: crear tablas + usuarios demo ─────────────────────────────────────
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            seeds = [
                User(email="admin@anomalias.com",  name="Administrador", hashed_password=hash_password("admin123"),  role="admin"),
                User(email="editor@anomalias.com", name="Editor",         hashed_password=hash_password("editor123"), role="editor"),
                User(email="viewer@anomalias.com", name="Visualizador",   hashed_password=hash_password("viewer123"), role="viewer"),
            ]
            db.add_all(seeds)
            db.commit()
            print("✅ Usuarios demo creados")
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
