"""Tests for claude_client module (DeepSeek LLM client)."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from services.claude_client import chat, chat_stream, get_client


@pytest.fixture(autouse=True)
def reset_client():
    """Reset the singleton before each test."""
    from services import claude_client
    claude_client._client = None
    yield
    claude_client._client = None


@pytest.fixture(autouse=True)
def ensure_api_key(monkeypatch):
    """Ensure API key is set to avoid KeyError or empty-key rejection."""
    monkeypatch.setenv("DEEPSEEK_API_KEY", "sk-test-dummy")


@pytest.mark.asyncio
async def test_get_client_creates_singleton():
    """get_client() creates an AsyncOpenAI instance on first call."""
    client = get_client()
    assert client is not None
    # Second call returns same instance
    assert get_client() is client


@pytest.mark.asyncio
async def test_chat_returns_text_content():
    """chat() returns the message content from the API response."""
    mock_response = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "Hello, world!"
    mock_response.choices = [mock_choice]

    with patch.object(get_client().chat.completions, "create", new=AsyncMock(return_value=mock_response)):
        result = await chat("system prompt", "user message")
        assert result == "Hello, world!"


@pytest.mark.asyncio
async def test_chat_uses_correct_model():
    """chat() passes the correct model to the API."""
    mock_response = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "response"
    mock_response.choices = [mock_choice]

    mock_create = AsyncMock(return_value=mock_response)
    with patch.object(get_client().chat.completions, "create", mock_create):
        await chat("sys", "msg", model="custom-model")
        assert mock_create.call_args[1]["model"] == "custom-model"


@pytest.mark.asyncio
async def test_chat_stream_yields_tokens():
    """chat_stream() yields delta content from streaming chunks."""
    chunks = []
    for text in ["Hello", " ", "World"]:
        chunk = MagicMock()
        delta = MagicMock()
        delta.content = text
        choice = MagicMock()
        choice.delta = delta
        chunk.choices = [choice]
        chunks.append(chunk)

    async def mock_stream():
        for c in chunks:
            yield c

    with patch.object(get_client().chat.completions, "create", new=AsyncMock(return_value=mock_stream())):
        tokens = []
        async for token in chat_stream("sys", "msg"):
            tokens.append(token)
        assert tokens == ["Hello", " ", "World"]


@pytest.mark.asyncio
async def test_chat_handles_empty_content():
    """chat() returns empty string when content is None."""
    mock_response = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = None
    mock_response.choices = [mock_choice]

    with patch.object(get_client().chat.completions, "create", new=AsyncMock(return_value=mock_response)):
        result = await chat("sys", "msg")
        assert result == ""
