"""LLM client wrapper — DeepSeek (OpenAI-compatible) API."""
from openai import AsyncOpenAI
from config import get_settings

settings = get_settings()
_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.deepseek_api_key,
            base_url="https://api.deepseek.com/v1",
        )
    return _client


async def chat(
    system: str,
    user_message: str,
    model: str | None = None,
    max_tokens: int = 4096,
    temperature: float = 0.7,
) -> str:
    """Send a chat request to DeepSeek and return the text response."""
    client = get_client()
    response = await client.chat.completions.create(
        model=model or settings.deepseek_model,
        max_tokens=max_tokens,
        temperature=temperature,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_message},
        ],
    )
    return response.choices[0].message.content or ""


async def chat_stream(
    system: str,
    user_message: str,
    model: str | None = None,
    max_tokens: int = 4096,
    temperature: float = 0.7,
):
    """Stream a chat response from DeepSeek."""
    client = get_client()
    stream = await client.chat.completions.create(
        model=model or settings.deepseek_model,
        max_tokens=max_tokens,
        temperature=temperature,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_message},
        ],
        stream=True,
    )
    async for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
