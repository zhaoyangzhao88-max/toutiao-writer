"""Application configuration from environment variables."""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    deepseek_api_key: str = ""
    deepseek_model: str = "deepseek-chat"
    firecrawl_api_key: str = ""
    tavily_api_key: str = ""
    unsplash_access_key: str = ""
    docx_output_dir: str = "E:/VSCODE/文章"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
