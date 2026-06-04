"""Shared pytest fixtures for backend tests."""
import pytest
from config import get_settings


@pytest.fixture(autouse=True)
def clear_settings_cache():
    """Clear the lru_cache on get_settings before each test."""
    get_settings.cache_clear()
    yield


@pytest.fixture
def anyio_backend():
    return 'asyncio'
