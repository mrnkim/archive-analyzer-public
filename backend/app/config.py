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
    # Second Knowledge Store for the Narrative Evolution tab (scenario "N").
    # Falls back to the primary ks_id when unset so existing deploys keep working.
    ks_id_narrative: str = Field(default="")
    allowed_origins: str = Field(default="http://localhost:5173")
    rate_limit_per_minute: int = Field(default=10)
    app_env: str = Field(default="development")

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    def ks_for_scenario(self, scenario: str | None) -> str:
        """Return the Knowledge Store id for a scenario.

        The Narrative Evolution tab (scenario "N") runs against a separate
        archive; everything else uses the primary brand-intelligence KS.
        Falls back to the primary ks_id when the narrative KS isn't set.
        """
        if scenario and scenario.upper() == "N" and self.ks_id_narrative:
            return self.ks_id_narrative
        return self.ks_id


@lru_cache
def get_settings() -> Settings:
    return Settings()
