"""Tests for config module."""
import os
import pytest
from config import get_settings, Settings


def test_default_settings_values(monkeypatch):
    """When .env is empty or missing, defaults should be used."""
    # Override .env values with empty strings to test defaults
    monkeypatch.setenv("DEEPSEEK_API_KEY", "")
    monkeypatch.setenv("FIRECRAWL_API_KEY", "")
    monkeypatch.setenv("TAVILY_API_KEY", "")
    monkeypatch.setenv("UNSPLASH_ACCESS_KEY", "")
    settings = Settings()
    assert settings.deepseek_api_key == ""
    assert settings.deepseek_model == "deepseek-chat"
    assert settings.firecrawl_api_key == ""
    assert settings.tavily_api_key == ""
    assert settings.unsplash_access_key == ""
    assert settings.firecrawl_api_key == ""
    assert settings.tavily_api_key == ""
    assert settings.docx_output_dir == "E:/VSCODE/文章"


def test_settings_reads_from_env(monkeypatch):
    """When env vars are set, they override defaults."""
    monkeypatch.setenv("DEEPSEEK_API_KEY", "sk-test-key")
    monkeypatch.setenv("DEEPSEEK_MODEL", "deepseek-v3")
    monkeypatch.setenv("DOCX_OUTPUT_DIR", "/tmp/output")

    settings = Settings()
    assert settings.deepseek_api_key == "sk-test-key"
    assert settings.deepseek_model == "deepseek-v3"
    assert settings.docx_output_dir == "/tmp/output"


def test_get_settings_is_cached():
    """get_settings() uses lru_cache so multiple calls return the same object."""
    get_settings.cache_clear()
    s1 = get_settings()
    s2 = get_settings()
    assert s1 is s2


def test_settings_partial_override(monkeypatch):
    """Only the env var that is set overrides; others stay default."""
    monkeypatch.setenv("DEEPSEEK_API_KEY", "sk-partial")
    settings = Settings()
    assert settings.deepseek_api_key == "sk-partial"
    assert settings.deepseek_model == "deepseek-chat"  # still default
