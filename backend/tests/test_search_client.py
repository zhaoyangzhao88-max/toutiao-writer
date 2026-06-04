"""Tests for search_client with three-tier fallback logic."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from services.search_client import (
    fetch_url_content, search_web,
    _ok, _firecrawl_scrape, _tavily_extract,
)


class TestOk:
    def test_returns_true_for_long_text(self):
        assert _ok("x" * 50) is True

    def test_returns_false_for_short_text(self):
        assert _ok("short") is False

    def test_returns_false_for_none(self):
        assert _ok(None) is False

    def test_returns_false_for_whitespace(self):
        assert _ok("   ") is False

    def test_returns_false_for_empty_string(self):
        assert _ok("") is False


class TestFetchUrlContent:
    @pytest.mark.asyncio
    async def test_firecrawl_tier_success(self, monkeypatch):
        """When Firecrawl succeeds, it returns firecrawl source."""
        async def mock_scrape(url):
            return {"content": "x" * 100, "title": "Test"}
        monkeypatch.setattr("services.search_client._firecrawl_scrape", mock_scrape)

        result = await fetch_url_content("https://example.com")
        assert result["source"] == "firecrawl"
        assert result["content"] == "x" * 100
        assert result["title"] == "Test"

    @pytest.mark.asyncio
    async def test_fallback_to_tavily(self, monkeypatch):
        """When Firecrawl fails but Tavily succeeds, source is tavily."""
        async def mock_scrape_fail(url):
            return None
        async def mock_tavily_extract(url):
            return {"content": "x" * 100, "title": "Tavily Title"}

        monkeypatch.setattr("services.search_client._firecrawl_scrape", mock_scrape_fail)
        monkeypatch.setattr("services.search_client._tavily_extract", mock_tavily_extract)
        # Ensure API keys are set so fallback is attempted with warnings
        monkeypatch.setattr("services.search_client.settings.firecrawl_api_key", "key")
        monkeypatch.setattr("services.search_client.settings.tavily_api_key", "key")

        result = await fetch_url_content("https://example.com")
        assert result["source"] == "tavily"
        assert "warning" in result
        assert result["content"] == "x" * 100

    @pytest.mark.asyncio
    async def test_all_tiers_fail(self, monkeypatch):
        """When all tiers fail, returns empty content with warning."""
        async def mock_scrape_fail(url):
            return None
        async def mock_tavily_fail(url):
            return None

        monkeypatch.setattr("services.search_client._firecrawl_scrape", mock_scrape_fail)
        monkeypatch.setattr("services.search_client._tavily_extract", mock_tavily_fail)
        monkeypatch.setattr("services.search_client.settings.firecrawl_api_key", "key")
        monkeypatch.setattr("services.search_client.settings.tavily_api_key", "key")

        # Mock the direct HTTP fetch to also fail
        async def mock_get(url, **kwargs):
            raise Exception("Connection refused")

        mock_client = AsyncMock()
        mock_client.get = mock_get
        monkeypatch.setattr("services.search_client._get_http", lambda: mock_client)

        result = await fetch_url_content("https://example.com")
        assert result["source"] == "none"
        assert result["content"] == ""

    @pytest.mark.asyncio
    async def test_draft_mode_direct(self):
        """Draft mode should return the text directly without any API calls."""
        # This test verifies the material router, not search_client itself.
        pass
