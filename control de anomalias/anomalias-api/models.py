import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, JSON
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="viewer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Analysis(Base):
    """Auditoría de cada análisis Shewhart ejecutado por un usuario."""
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    col_x = Column(String(100))
    col_y = Column(String(100))
    sigma = Column(Float, default=3.0)
    total_puntos = Column(Integer)
    total_anomalias = Column(Integer)
    puntos_display = Column(Integer)
    downsampled = Column(Boolean, default=False)
    media = Column(Float)
    lcs = Column(Float)
    lci = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Report(Base):
    """Análisis guardado y compartible con cualquier usuario autenticado."""
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=True)
    col_x = Column(String(100), nullable=False)
    cols_y = Column(JSON, nullable=False)         # list[str]
    sigma = Column(Float, default=3.0)
    results_json = Column(JSON, nullable=False)   # list[AnalysisResult] serializado
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_by_name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
