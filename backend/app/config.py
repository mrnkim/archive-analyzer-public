from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    twelvelabs_api_key: str = Field(default="")
    jockey_base_url: str = Field(default="https://api.twelvelabs.io/v1.3")
    ks_id: str = Field(default="")
    allowed_origins: str = Field(default="http://localhost:5173")
    rate_limit_per_minute: int = Field(default=10)
    app_env: str = Field(default="development")

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
