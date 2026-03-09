from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Always resolve to backend/.env regardless of working directory
_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    app_name: str = "OmniChat API"
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/omnichat"

    # Clerk Authentication
    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""

    # AWS Bedrock
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_session_token: str = ""  # optional, for temporary credentials
    aws_region: str = "us-east-1"

    # Hosted Ollama
    ollama_base_url: str = "http://localhost:11434"

    # CORS — comma-separated list of allowed origins
    allowed_origins: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    def validate_required(self) -> None:
        """Fail loudly at startup if critical environment variables are missing."""
        missing: list[str] = []
        if not self.clerk_secret_key:
            missing.append("CLERK_SECRET_KEY")
        if not self.aws_access_key_id:
            missing.append("AWS_ACCESS_KEY_ID")
        if not self.aws_secret_access_key:
            missing.append("AWS_SECRET_ACCESS_KEY")
        if not self.database_url:
            missing.append("DATABASE_URL")
        if missing:
            raise RuntimeError(
                f"\n\n[OmniChat] STARTUP FAILED — Missing required environment variables:\n"
                f"  {', '.join(missing)}\n"
                f"Please copy .env.example to .env and fill in the values.\n"
            )


settings = Settings()
