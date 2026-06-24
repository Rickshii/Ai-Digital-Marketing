from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import timedelta
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User as UserModel
from app.schemas.user import UserCreate, User as UserSchema, Token, TokenData
from app.services.access_service import AccessService

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> UserModel:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
        token_data = TokenData(user_id=user_id)
    except (JWTError, ValueError):
        raise credentials_exception
        
    user = db.query(UserModel).filter(UserModel.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_admin_user(current_user: UserModel = Depends(get_current_user)) -> UserModel:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges"
        )
    return current_user

def get_current_active_user(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UserModel:
    status_dict = AccessService.get_access_status(db, current_user.id)
    if not status_dict["has_access"]:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Your free trial has expired or you do not have an active subscription. Please upgrade to continue."
        )
    return current_user


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(UserModel).filter(UserModel.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    
    # Hash password and save (enforce role='user' to prevent privilege escalation)
    hashed_pwd = get_password_hash(user_in.password)
    db_user = UserModel(
        email=user_in.email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
        role="user"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Automatically start 3-day free trial
    AccessService.start_trial(db, db_user.id)
    
    return db_user


@router.post("/login", response_model=Token)
async def login(request: Request, db: Session = Depends(get_db)):
    import logging
    logger = logging.getLogger("uvicorn.error")

    content_type = request.headers.get("content-type", "")
    if content_type.startswith("application/json"):
        body = await request.json()
        username = body.get("username") or body.get("email")
        password = body.get("password")
    else:
        form = await request.form()
        username = form.get("username") or form.get("email")
        password = form.get("password")

    logger.info(f"[Auth] Login attempt for: {username} (content-type: {content_type})")

    if not username or not password:
        logger.warning("[Auth] Login rejected: missing email or password")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required."
        )

    user = db.query(UserModel).filter(UserModel.email == username).first()
    if not user:
        logger.warning(f"[Auth] Login failed: user '{username}' not found in database")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )

    if not verify_password(password, user.hashed_password):
        logger.warning(f"[Auth] Login failed: password mismatch for '{username}' (id={user.id})")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    logger.info(f"[Auth] Login SUCCESS for '{username}' (id={user.id}, role={user.role})")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/health")
def auth_health(db: Session = Depends(get_db)):
    """Health check endpoint for frontend connectivity verification."""
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    return {
        "status": "ok",
        "database": db_status,
        "auth_service": "operational"
    }

@router.post("/logout")
def logout():
    return {"detail": "Successfully logged out. Please discard your JWT token."}

@router.get("/me", response_model=UserSchema)
def read_current_user(current_user: UserModel = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Reset password for a registered user (demo mode — no email verification)."""
    user = db.query(UserModel).filter(UserModel.email == body.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address."
        )
    if len(body.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters."
        )
    user.hashed_password = get_password_hash(body.new_password)
    db.commit()
    return {"detail": "Password has been reset successfully. You can now log in with your new password."}


from fastapi import UploadFile, File
from typing import Optional
import shutil
import os
import uuid

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

@router.put("/profile", response_model=UserSchema)
def update_profile(
    body: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.avatar_url is not None:
        current_user.avatar_url = body.avatar_url
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/profile/avatar")
def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    from app.services.storage_service import StorageService
    file_bytes = file.file.read()
    mime_type = file.content_type or "image/png"
    
    avatar_url = StorageService.upload_file(file_bytes, file.filename, mime_type, folder="avatars")
    current_user.avatar_url = avatar_url
    db.commit()
    db.refresh(current_user)
    
    return {"success": True, "avatar_url": avatar_url}
