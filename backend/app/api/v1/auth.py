import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import create_access_token, hash_password, verify_password
from app.models.auth import OtpCode, OtpPurpose, PasswordReset, User, UserStatus
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    OtpResend,
    OtpVerify,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserRead,
)
from app.services.email_service import send_otp_email
from app.services.otp import generate_otp, otp_expiry, verify_otp
from app.api.v1.activity_log import log_activity

router = APIRouter(prefix="/auth", tags=["auth"])


def _issue_otp(session: Session, user: User, purpose: OtpPurpose) -> str:
    code, code_hash = generate_otp()
    otp = OtpCode(
        user_id=user.id,
        code_hash=code_hash,
        purpose=purpose,
        expires_at=otp_expiry(),
    )
    session.add(otp)
    session.commit()
    send_otp_email(user.email, code, purpose.value)
    return code


@router.post("/register", response_model=UserRead, status_code=201)
def register(payload: UserCreate, session: Session = Depends(get_session)) -> User:
    existing = session.exec(
        select(User).where((User.username == payload.username) | (User.email == payload.email))
    ).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Username hoặc email đã tồn tại")
    user = User(
        username=payload.username,
        display_name=payload.display_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        status=UserStatus.pending,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    _issue_otp(session, user, OtpPurpose.signup)
    log_activity(session, user.id, "register", "user", user.id)
    return user


@router.post("/verify-otp")
def verify_account_otp(payload: OtpVerify, session: Session = Depends(get_session)) -> dict:
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy tài khoản")
    otp = session.exec(
        select(OtpCode)
        .where(
            OtpCode.user_id == user.id,
            OtpCode.purpose == payload.purpose,
            OtpCode.used_at.is_(None),
        )
        .order_by(OtpCode.created_at.desc())
    ).first()
    if not otp or not verify_otp(payload.code, otp.code_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "OTP không hợp lệ")
    if otp.expires_at < otp.created_at:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "OTP đã hết hạn")
    otp.used_at = otp.created_at  # placeholder to mark used
    session.add(otp)
    session.commit()
    return {"message": "OTP hợp lệ. Tài khoản chờ admin xác nhận."}


@router.post("/resend-otp")
def resend_otp(payload: OtpResend, session: Session = Depends(get_session)) -> dict:
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy tài khoản")
    _issue_otp(session, user, OtpPurpose(payload.purpose))
    return {"message": "Đã gửi lại OTP"}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, session: Session = Depends(get_session)) -> TokenResponse:
    user = session.exec(
        select(User).where(User.username == payload.username)
    ).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sai username hoặc mật khẩu")
    if user.status == UserStatus.pending:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Tài khoản chưa được admin xác nhận")
    if user.status == UserStatus.blocked:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Tài khoản đã bị khóa")
    token = create_access_token(user.id)
    log_activity(session, user.id, "login", "user", user.id)
    return TokenResponse(access_token=token, user=UserRead.model_validate(user))


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, session: Session = Depends(get_session)) -> dict:
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if not user:
        return {"message": "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu"}
    _issue_otp(session, user, OtpPurpose.reset)
    return {"message": "Đã gửi mã OTP đặt lại mật khẩu"}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, session: Session = Depends(get_session)) -> dict:
    # token here is the OTP code sent for reset purpose; frontend collects via verify-otp first
    raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "Sẽ triển khai ở M1 hoàn chỉnh")
