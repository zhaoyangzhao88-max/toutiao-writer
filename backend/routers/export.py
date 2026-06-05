"""Export router - Steps 10-12: Images, DOCX generation."""
import os
import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from models.schemas import ExportDocxRequest, SuggestImagesRequest, SuggestImagesResult
from services.docx_generator import generate_docx
from services.claude_client import chat
from config import get_settings

settings = get_settings()
router = APIRouter()

UNSPLASH_API = "https://api.unsplash.com/search/photos"

SUGGEST_IMAGES_PROMPT = """你是头条文章的配图策划专家。根据文章内容，策划5张配图。

每张配图需要：
1. topic（中文主题，10字以内）
2. keywords（英文搜索关键词，用于Unsplash搜图，3-5个词用空格隔开）
3. reason（为什么这张图配这篇文章的这个位置，20字以内）

要求：
- 5张图覆盖文章的不同段落/主题，不要重复
- 关键词要具体、可搜索，不要用太宽泛的词
- 风格多样化：人物、场景、物品、抽象概念搭配

输出JSON：
{
  "suggestions": [
    {"topic": "科技感城市夜景", "keywords": "smart city night neon lights", "reason": "配数字化主题段落"},
    {"topic": "会议讨论场景", "keywords": "business meeting discussion diverse", "reason": "配团队协作段落"},
    {"topic": "自然森林光影", "keywords": "sunlight forest nature peaceful", "reason": "配环境描写段落"}
  ]
}"""


@router.post("/suggest-images")
async def suggest_images(req: SuggestImagesRequest):
    """Step 10: Generate 5 image suggestions based on article content."""
    try:
        # Strip HTML to get plain text
        import re
        text = re.sub(r'<[^>]+>', '', req.article)
        # Take first 2000 chars for analysis
        text = text[:2000].strip()
        if not text:
            return {"suggestions": [
                {"topic": "城市天际线", "keywords": "city skyline architecture", "reason": "默认配图"},
                {"topic": "人群活动", "keywords": "people crowd event gathering", "reason": "默认配图"},
                {"topic": "自然风光", "keywords": "nature landscape mountain", "reason": "默认配图"},
                {"topic": "社交场景", "keywords": "social interaction conversation", "reason": "默认配图"},
                {"topic": "抽象意境", "keywords": "abstract art minimal creative", "reason": "默认配图"},
            ]}

        user_msg = "文章内容：\n" + text + "\n\n请根据以上文章内容，生成5张配图建议。"
        response = await chat(SUGGEST_IMAGES_PROMPT, user_msg, max_tokens=2048, temperature=0.7)
        from services.utils import extract_json
        result = extract_json(response)
        # Ensure we have 5 suggestions
        suggestions = result.get("suggestions", [])
        while len(suggestions) < 5:
            suggestions.append({"topic": "配图", "keywords": "photo image", "reason": "补充配图"})
        result["suggestions"] = suggestions[:5]
        return result
    except Exception as e:
        # Fallback to defaults
        return {"suggestions": [
            {"topic": "城市天际线", "keywords": "city skyline architecture", "reason": "默认配图"},
            {"topic": "人群活动", "keywords": "people crowd event gathering", "reason": "默认配图"},
            {"topic": "自然风光", "keywords": "nature landscape mountain", "reason": "默认配图"},
            {"topic": "社交场景", "keywords": "social interaction conversation", "reason": "默认配图"},
            {"topic": "抽象意境", "keywords": "abstract art minimal creative", "reason": "默认配图"},
        ]}


@router.get("/images")
async def search_images(keywords: str = ""):
    """Step 10: Search Unsplash for images by keywords."""
    if not settings.unsplash_access_key or settings.unsplash_access_key == "xxx":
        return {
            "results": [],
            "source": "placeholder",
            "warning": "Unsplash API key not configured. Using placeholder image links.",
            "placeholderUrls": [
                "https://images.unsplash.com/photo-" + str(i) + "?w=400&h=300&fit=crop"
                for i in range(1, 6)
            ],
        }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                UNSPLASH_API,
                params={"query": keywords, "per_page": 5},
                headers={"Authorization": "Client-ID " + settings.unsplash_access_key},
            )
            if resp.status_code == 200:
                data = resp.json()
                results = [
                    {
                        "id": r.get("id"),
                        "regularUrl": r.get("urls", {}).get("regular", ""),
                        "thumbUrl": r.get("urls", {}).get("thumb", ""),
                        "alt": r.get("alt_description", ""),
                        "author": r.get("user", {}).get("name", ""),
                    }
                    for r in data.get("results", [])
                ]
                return {"results": results, "source": "unsplash"}
            raise HTTPException(resp.status_code, "Unsplash API error: " + str(resp.status_code))
    except httpx.TimeoutException:
        raise HTTPException(504, "Unsplash API timeout")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/docx")
async def generate_docx_file(req: ExportDocxRequest):
    """Step 11: Generate .docx file and return download URL."""
    try:
        output_dir = settings.docx_output_dir
        os.makedirs(output_dir, exist_ok=True)

        filename = generate_docx(
            article=req.article,
            title=req.title,
            images=req.images or [],
            output_dir=output_dir,
        )

        return {
            "filename": filename,
            "downloadUrl": "/api/export/download/" + filename,
            "wordCount": len(req.article),
        }
    except Exception as e:
        raise HTTPException(500, "DOCX generation failed: " + str(e))


@router.get("/download/{filename}")
async def download_docx(filename: str):
    """Download a generated .docx file."""
    output_dir = settings.docx_output_dir
    filepath = os.path.join(output_dir, filename)

    if not os.path.exists(filepath):
        raise HTTPException(404, "File not found: " + filename)

    return FileResponse(
        filepath,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=filename,
    )
