"""Export router - Steps 10-12: Images, DOCX generation."""
import os
import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from models.schemas import ExportDocxRequest
from services.docx_generator import generate_docx
from config import get_settings

settings = get_settings()
router = APIRouter()

UNSPLASH_API = "https://api.unsplash.com/search/photos"


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
