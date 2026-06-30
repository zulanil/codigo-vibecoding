from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserRegister, UserLogin, TokenResponse, UserOut
from auth.jwt import hash_password, verify_password, create_access_token
from auth.dependencies import get_current_user, require_role
from typing import List

router = APIRouter(prefix="/api/auth", tags=["auth"])

ALLOWED_ROLES = {"admin", "editor", "viewer"}


@router.post("/register", response_model=TokenResponse, summary="Crear cuenta")
def register(body: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(400, "Email ya registrado")

    role = body.role if body.role in ALLOWED_ROLES else "viewer"

    user = User(
        email=body.email,
        name=body.name,
        hashed_password=hash_password(body.password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.email, "user_id": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role},
    }


@router.post("/login", response_model=TokenResponse, summary="Iniciar sesión")
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email, User.is_active == True).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(401, "Credenciales incorrectas")

    token = create_access_token({"sub": user.email, "user_id": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role},
    }


@router.get("/me", response_model=UserOut, summary="Perfil actual")
def me(user: User = Depends(get_current_user)):
    return user


@router.get("/users", response_model=List[UserOut], summary="Listar usuarios [Admin]")
def list_users(
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("admin")),
):
    return db.query(User).order_by(User.created_at).all()


@router.patch("/users/{user_id}/role", summary="Cambiar rol de usuario [Admin]")
def change_role(
    user_id: int,
    body: dict,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "Usuario no encontrado")
    new_role = body.get("role", "")
    if new_role not in ALLOWED_ROLES:
        raise HTTPException(400, f"Rol inválido. Opciones: {list(ALLOWED_ROLES)}")
    target.role = new_role
    db.commit()
    return {"ok": True, "role": new_role}
