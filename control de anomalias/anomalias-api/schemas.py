from pydantic import BaseModel


class UserRegister(BaseModel):
    email: str
    name: str
    password: str
    role: str = "viewer"  # admin puede especificar otro rol al crear usuarios


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
