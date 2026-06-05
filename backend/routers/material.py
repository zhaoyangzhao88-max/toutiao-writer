"""Material input router - Steps 1-3."""
import json
import re
from fastapi import APIRouter, HTTPException
from models.schemas import FetchMaterialRequest, FetchMaterialResponse, ExtractMaterialRequest
from services.claude_client import chat
from services.search_client import fetch_url_content, search_web


from services.utils import extract_json

router = APIRouter()

MATERIAL_EXTRACT_PROMPT = """你是素材提炼专家。根据用户提供的原始素材和引导问答，提炼出素材卡。

输出严格的JSON格式（不要markdown代码块）：
{
  "coreTopic": "一句话概括核心话题",
  "keyData": ["数据1", "数据2"],
  "cases": ["案例1", "案例2"],
  "controversies": ["争议点1"],
  "goldenQuote": "最有冲击力的一句话"
}"""


@router.post("/fetch", response_model=FetchMaterialResponse)
async def fetch_material(req: FetchMaterialRequest):
    if req.mode == "url" and req.url:
        result = await fetch_url_content(req.url)
        return FetchMaterialResponse(
            content=result["content"],
            title=result.get("title"),
            source=result["source"],
        )
    elif req.mode == "draft" and req.text:
        return FetchMaterialResponse(content=req.text, source="manual")
    elif req.mode == "topic" and req.topic:
        result = await search_web(req.topic)
        search_text = "\n\n".join([
            "标题：" + r["title"] + "\n链接：" + r["url"] + "\n摘要：" + r["snippet"]
            for r in result.get("results", [])
        ])
        return FetchMaterialResponse(
            content=search_text or "未找到相关结果。" + result.get("warning", ""),
            source=result["source"],
        )
    raise HTTPException(400, "Invalid request: need url, text, or topic based on mode")


@router.post("/extract")
async def extract_material(req: ExtractMaterialRequest):
    user_msg = "原始素材：\n" + req.raw_material + "\n\n"
    if req.guide_answers:
        user_msg += "引导问答：\n" + str(req.guide_answers) + "\n"
    user_msg += "\n请提炼素材卡。"

    try:
        response = await chat(MATERIAL_EXTRACT_PROMPT, user_msg, max_tokens=2048)
        result = extract_json(response)
        return result
    except json.JSONDecodeError as e:
        raise HTTPException(500, "Failed to parse AI response: " + str(e))
    except Exception as e:
        raise HTTPException(500, str(e))
