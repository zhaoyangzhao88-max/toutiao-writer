"""Three-tier fallback search client.

URL fetch:  Firecrawl scrape -> Tavily extract -> basic httpx GET
Web search: Firecrawl search -> Tavily search

Each function returns a dict with `content`/`results`, `source`, and
optionally `warning` when a lower tier was used.
"""
from __future__ import annotations

import httpx
from config import get_settings

settings = get_settings()

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

_client: httpx.AsyncClient | None = None


def _get_http() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=30.0)
    return _client


def _ok(text: str | None) -> bool:
    """Return True when *text* looks like a meaningful result."""
    return bool(text and len(text.strip()) >= 50)


# ---------------------------------------------------------------------------
# Tier-1 / Tier-2 adapters (Firecrawl & Tavily are called via MCP helpers
# exposed as Python functions — the concrete wiring is in main.py or the
# router layer.  This module provides the *local* fallback logic.)
#
# In the real app these thin wrappers would be imported from a single
# `mcp_adapters` module.  Here we inline simple stubs that the caller can
# replace when connecting the actual MCP tool bindings.
# ---------------------------------------------------------------------------

# --- Firecrawl stubs (replace with real MCP calls) -----------------------

async def _firecrawl_scrape(url: str) -> dict | None:
    """Try Firecrawl scrape.  Returns dict with keys content, title or None."""
    if not settings.firecrawl_api_key:
        return None
    try:
        http = _get_http()
        resp = await http.post(
            "https://api.firecrawl.dev/v1/scrape",
            json={"url": url, "formats": ["markdown"]},
            headers={"Authorization": f"Bearer {settings.firecrawl_api_key}"},
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("success"):
                md = (data.get("data") or {}).get("markdown", "")
                if _ok(md):
                    return {
                        "content": md,
                        "title": (data.get("data") or {}).get("metadata", {}).get("title"),
                    }
    except Exception:
        pass  # silent fallback to next tier
    return None


async def _firecrawl_search(query: str) -> dict | None:
    """Try Firecrawl search.  Returns dict with key 'results' (list of
    {title, url, snippet} dicts) or None."""
    if not settings.firecrawl_api_key:
        return None
    try:
        http = _get_http()
        resp = await http.post(
            "https://api.firecrawl.dev/v1/search",
            json={"query": query},
            headers={"Authorization": f"Bearer {settings.firecrawl_api_key}"},
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get("success"):
                items = (data.get("data") or [])
                results = [
                    {
                        "title": r.get("title", ""),
                        "url": r.get("url", ""),
                        "snippet": r.get("description", ""),
                    }
                    for r in items
                ]
                if results:
                    return {"results": results}
    except Exception:
        pass
    return None


# --- Tavily stubs (replace with real MCP calls) --------------------------

async def _tavily_extract(url: str) -> dict | None:
    """Try Tavily extract.  Returns dict with keys content, title or None."""
    if not settings.tavily_api_key:
        return None
    try:
        http = _get_http()
        resp = await http.post(
            "https://api.tavily.com/extract",
            json={"urls": [url]},
            headers={"Authorization": f"Bearer {settings.tavily_api_key}"},
        )
        if resp.status_code == 200:
            data = resp.json()
            results = data.get("results", [])
            if results and _ok(results[0].get("raw_content", "")):
                return {
                    "content": results[0]["raw_content"],
                    "title": results[0].get("title"),
                }
    except Exception:
        pass
    return None


async def _tavily_search(query: str) -> dict | None:
    """Try Tavily search.  Returns dict with key 'results' or None."""
    if not settings.tavily_api_key:
        return None
    try:
        http = _get_http()
        resp = await http.post(
            "https://api.tavily.com/search",
            json={"query": query, "max_results": 10},
            headers={"Authorization": f"Bearer {settings.tavily_api_key}"},
        )
        if resp.status_code == 200:
            data = resp.json()
            items = data.get("results", [])
            results = [
                {
                    "title": r.get("title", ""),
                    "url": r.get("url", ""),
                    "snippet": r.get("content", ""),
                }
                for r in items
            ]
            if results:
                return {"results": results}
    except Exception:
        pass
    return None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def fetch_url_content(url: str) -> dict:
    """Fetch the content of a single URL with three-tier fallback.

    Returns:
        {"content": str, "title": str | None, "source": str, "warning": str}
    """
    warning = None

    # Tier 1: Firecrawl scrape
    result = await _firecrawl_scrape(url)
    if result:
        return {
            "content": result["content"],
            "title": result.get("title"),
            "source": "firecrawl",
        }

    # Tier 1 fallback note
    if settings.firecrawl_api_key:
        warning = "Firecrawl scrape failed or returned empty; falling back to Tavily extract."

    # Tier 2: Tavily extract
    result = await _tavily_extract(url)
    if result:
        return {
            "content": result["content"],
            "title": result.get("title"),
            "source": "tavily",
            **({"warning": warning} if warning else {}),
        }

    if settings.tavily_api_key:
        prefix = (warning + " ") if warning else ""
        warning = prefix + "Tavily extract failed; using basic HTTP fetch."

    # Tier 3: basic httpx GET
    try:
        http = _get_http()
        resp = await http.get(url, headers={"User-Agent": "toutiao-writer/1.0"})
        if resp.status_code == 200:
            text = resp.text
            if _ok(text):
                return {
                    "content": text,
                    "title": None,
                    "source": "direct",
                    **({"warning": warning} if warning else {}),
                }
    except Exception as exc:
        return {
            "content": "",
            "title": None,
            "source": "none",
            "warning": f"All tiers failed. Last error: {exc}",
        }

    return {
        "content": "",
        "title": None,
        "source": "none",
        "warning": warning or "Could not fetch any content from the URL.",
    }


async def search_web(query: str) -> dict:
    """Search the web with two-tier fallback.

    Returns:
        {"results": list[dict], "source": str, "warning": str | None}
        Each result dict: {"title": str, "url": str, "snippet": str}
    """
    warning = None

    # Tier 1: Firecrawl search
    result = await _firecrawl_search(query)
    if result:
        return {"results": result["results"], "source": "firecrawl"}

    if settings.firecrawl_api_key:
        warning = "Firecrawl search failed or returned empty; falling back to Tavily search."

    # Tier 2: Tavily search
    result = await _tavily_search(query)
    if result:
        return {
            "results": result["results"],
            "source": "tavily",
            **({"warning": warning} if warning else {}),
        }

    return {
        "results": [],
        "source": "none",
        "warning": warning + " Tavily search also failed." if warning else "All search tiers failed. Check API keys.",
    }
