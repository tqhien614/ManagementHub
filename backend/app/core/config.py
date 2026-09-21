from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/managementhub"
    SECRET_KEY: str = "dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    OPENAI_API_KEY: str = ""

    # Anthropic (LLM) — used for RAG answers + Copilot
    ANTHROPIC_BASE_URL: str = ""
    ANTHROPIC_AUTH_TOKEN: str = ""
    ANTHROPIC_MODEL: str = "claude-sonnet-5"

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "no-reply@managementhub.local"

    UPLOAD_DIR: str = "storage/uploads"
    FRONTEND_URL: str = "http://localhost:3000"
    DEV_PRINT_OTP: bool = True


settings = Settings()
