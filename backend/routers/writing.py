"""Writing router - Steps 4-6: Deconstruct, Titles, Article."""
import json
import re
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import (
    DeconstructResult, TitleGeneration, ArticleRequest,
    DeconstructRequest as DeconstructReq,
    TitleRequest,
)
from services.claude_client import chat, chat_stream
from services.prompts import step4_deconstruct, step5_titles, step6_article

router = APIRouter()


from services.utils import extract_json
from services.guide_writer import build_writing_compass


@router.post("/deconstruct")
async def deconstruct(req: DeconstructReq):
    """Step 4: Scan for fuzzy/buzz words and suggest plain language replacements."""
    try:
        material_str = json.dumps(req.material_card, ensure_ascii=False)
        user_msg = "素材卡：\n" + material_str

        compass = build_writing_compass(req.guide_answers)
        if compass:
            user_msg += "\n\n【写作指南针】\n" + json.dumps(compass, ensure_ascii=False)

        response = await chat(
            step4_deconstruct.SYSTEM_PROMPT,
            user_msg,
            max_tokens=2048,
            temperature=0.5,
        )
        result = extract_json(response)
        return result
    except json.JSONDecodeError as e:
        raise HTTPException(500, "Failed to parse AI response: " + str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/titles")
async def generate_titles(req: TitleRequest):
    """Step 5: Generate 3-5 headline candidates with trigger matching."""
    try:
        user_msg = step5_titles.build_user_message(
            req.material_card,
            req.deconstruct_result or {},
        )

        compass = build_writing_compass(req.guide_answers)
        if compass:
            user_msg += "\n\n【写作指南针（写标题时需考虑）】\n" + json.dumps(compass, ensure_ascii=False)

        response = await chat(
            step5_titles.SYSTEM_PROMPT,
            user_msg,
            max_tokens=2048,
            temperature=0.8,
        )
        result = extract_json(response)
        return result
    except json.JSONDecodeError as e:
        raise HTTPException(500, "Failed to parse AI response: " + str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/article")
async def write_article(req: ArticleRequest):
    """Step 6: Generate article body (non-streaming)."""
    try:
        user_msg = step6_article.build_user_message(
            req.title,
            req.material_card,
            req.deconstruct_result or {},
            req.word_count,
        )

        compass = build_writing_compass(req.guide_answers)
        if compass:
            user_msg += "\n\n【写作指南针】\n" + json.dumps(compass, ensure_ascii=False)

        response = await chat(
            step6_article.SYSTEM_PROMPT,
            user_msg,
            max_tokens=max(req.word_count * 3, 8192),
            temperature=0.7,
        )
        word_count = len(response)
        return {"article": response, "wordCount": word_count}
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/article/stream")
async def write_article_stream(req: ArticleRequest):
    """Step 6: Generate article body with SSE streaming."""
    user_msg = step6_article.build_user_message(
        req.title,
        req.material_card,
        req.deconstruct_result or {},
        req.word_count,
    )

    compass = build_writing_compass(req.guide_answers)
    if compass:
        user_msg += "\n\n【写作指南针】\n" + json.dumps(compass, ensure_ascii=False)

    async def event_stream():
        try:
            async for token in chat_stream(
                step6_article.SYSTEM_PROMPT,
                user_msg,
                max_tokens=max(req.word_count * 3, 8192),
                temperature=0.7,
            ):
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
