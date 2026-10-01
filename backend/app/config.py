from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://appetyt:appetyt@localhost:5432/appetyt"
    cors_origins: str = (
        "http://localhost:3000,http://localhost:8081,http://localhost,https://localhost,capacitor://localhost"
    )
    data_dir: Path = ROOT / "data"
    environment: str = "development"
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/v1/auth/google/callback"
    auth_frontend_url: str = "http://localhost:3000"
    auth_mobile_redirect_uri: str = "appetyt://auth/callback"
    auth_session_ttl_days: int = 365
    auth_cookie_name: str = "appetyt_session"
    auth_state_cookie_name: str = "appetyt_oauth_state"
    auth_cookie_secure: bool | None = None
    recipe_submission_daily_limit: int = 5
    recipe_image_dir: Path = ROOT / "data" / "recipe-images"

    model_config = SettingsConfigDict(env_file=(ROOT / ".env", ROOT / ".env.local"), extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def cors_allow_credentials(self) -> bool:
        return "*" not in self.cors_origin_list

    @property
    def secure_auth_cookies(self) -> bool:
        if self.environment.lower() not in {"development", "test"}:
            return True
        return self.auth_cookie_secure if self.auth_cookie_secure is not None else False


@lru_cache
def get_settings() -> Settings:
    return Settings()
