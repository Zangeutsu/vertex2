from functools import lru_cache
from typing import Any, List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ETT Manager"
    database_url: str = "sqlite+aiosqlite:///./data.db"
    echo_sql: bool = False
    api_v1_prefix: str = "/api/v1"
    allowed_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def split_origins(cls, v: Any) -> Any:
        if isinstance(v, str):
            # Check if it looks like a JSON list
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except:
                    # Strip brackets and continue to normal split
                    v = v[1:-1]
            return [i.strip().strip('"').strip("'") for i in v.split(",") if i.strip()]
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()
