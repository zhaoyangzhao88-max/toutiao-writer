"""Tests for export router."""
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch

from main import app


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_images_returns_placeholders_when_no_key(client, monkeypatch):
    """When Unsplash key is not configured, return placeholder URLs."""
    monkeypatch.setattr("routers.export.settings.unsplash_access_key", "xxx")
    async with client as ac:
        response = await ac.get("/api/export/images?keywords=test")
    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "placeholder"
    assert "warning" in data
    assert len(data["placeholderUrls"]) == 5


@pytest.mark.asyncio
async def test_images_requires_keywords(client, monkeypatch):
    """Even without keywords, should still work with placeholders."""
    monkeypatch.setattr("routers.export.settings.unsplash_access_key", "xxx")
    async with client as ac:
        response = await ac.get("/api/export/images")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_docx_generation(client, monkeypatch, tmpdir):
    """DOCX generation returns filename and download URL."""
    monkeypatch.setattr("routers.export.settings.docx_output_dir", str(tmpdir))
    monkeypatch.setattr(
        "routers.export.generate_docx",
        lambda article, title, images, output_dir: "20260604_test.docx",
    )

    async with client as ac:
        response = await ac.post(
            "/api/export/docx",
            json={
                "title": "Test",
                "article": "Test article content",
                "images": [],
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "20260604_test.docx"
    assert "/api/export/download/" in data["downloadUrl"]
    assert data["wordCount"] > 0
