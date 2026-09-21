import secrets
from datetime import timedelta

from app.core.security import pwd_context
from app.core.timeutil import now_utc

OTP_TTL_MINUTES = 10
OTP_DIGITS = 6


def generate_otp() -> tuple[str, str]:
    """Return (plain_code, code_hash). Plain code shown to user, hash stored."""
    code = "".join(secrets.choice("0123456789") for _ in range(OTP_DIGITS))
    return code, pwd_context.hash(code)


def verify_otp(code: str, code_hash: str) -> bool:
    try:
        return pwd_context.verify(code, code_hash)
    except Exception:
        return False


def otp_expiry() -> "now_utc":
    return now_utc() + timedelta(minutes=OTP_TTL_MINUTES)
