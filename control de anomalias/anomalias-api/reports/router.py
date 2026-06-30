from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models import Report
from auth.dependencies import get_current_user, require_role
from models import User

router = APIRouter(prefix="/api/reports", tags=["reports"])


class ReportCreate(BaseModel):
    title: Optional[str] = None
    col_x: str
    cols_y: list[str]
    sigma: float
    results_json: list  # AnalysisResult[] del frontend


class ReportOut(BaseModel):
    id: str
    title: Optional[str]
    col_x: str
    cols_y: list[str]
    sigma: float
    created_by_name: str
    created_at: str
    results_json: list | None = None

    model_config = {"from_attributes": True}


@router.post("", response_model=ReportOut, summary="Guardar análisis [Admin/Editor]")
def create_report(
    body: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "editor")),
):
    report = Report(
        title=body.title or f"Análisis {body.col_x} / {', '.join(body.cols_y)}",
        col_x=body.col_x,
        cols_y=body.cols_y,
        sigma=body.sigma,
        results_json=body.results_json,
        created_by_id=current_user.id,
        created_by_name=current_user.name,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return _out(report, include_results=True)


@router.get("", summary="Listar reportes [todos los roles]")
def list_reports(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    return [_out(r, include_results=False) for r in reports]


@router.get("/{report_id}", summary="Ver reporte [todos los roles]")
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(404, "Reporte no encontrado")
    return _out(report, include_results=True)


@router.delete("/{report_id}", summary="Eliminar reporte [Admin]")
def delete_report(
    report_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(404, "Reporte no encontrado")
    db.delete(report)
    db.commit()
    return {"ok": True}


def _out(r: Report, include_results: bool) -> dict:
    return {
        "id": r.id,
        "title": r.title,
        "col_x": r.col_x,
        "cols_y": r.cols_y,
        "sigma": r.sigma,
        "created_by_name": r.created_by_name,
        "created_at": str(r.created_at),
        "results_json": r.results_json if include_results else None,
    }
