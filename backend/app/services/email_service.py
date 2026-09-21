import smtplib
from email.mime.text import MIMEText

from app.core.config import settings


def send_otp_email(to_email: str, otp_code: str, purpose: str = "signup") -> None:
    subject = "AI-PDMH — Mã xác nhận OTP" if purpose == "signup" else "AI-PDMH — Mã đặt lại mật khẩu"
    body = f"Mã OTP của bạn là: {otp_code}\nMã có hiệu lực trong 10 phút."

    if settings.DEV_PRINT_OTP or not settings.SMTP_HOST:
        print(f"[DEV OTP] to={to_email} purpose={purpose} code={otp_code}")
        return

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM, [to_email], msg.as_string())
