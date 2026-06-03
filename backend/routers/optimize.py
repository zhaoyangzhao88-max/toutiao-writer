"""Optimization router - Steps 7-9: Diagnosis, Hook, AI Check."""
import json
import re
import traceback
from fastapi import APIRouter, HTTPException
from models.schemas import (
    DiagnosisRequest, HookRequest, AiCheckRequest, FixRequest,
)
from services.claude_client import chat
from services.prompts import step7_diagnosis, step8_hook, step9_ai_check

router = APIRouter()


def extract_json(text: str) -> dict:
    """Extract JSON from AI response, handling markdown code blocks."""
    text = text.strip()
    # Try to extract from ```json ... ``` block
    m = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    if m:
        return json.loads(m.group(1))
    # Try to extract from { ... }
    m = re.search(r'\{.*\}', text, re.DOTALL)
    if m:
        return json.loads(m.group(0))
    return json.loads(text)


@router.post("/diagnose")
async def diagnose(req: DiagnosisRequest):
    """Step 7: Five-dimension diagnosis report."""
    try:
        user_msg = step7_diagnosis.build_user_message(req.article, req.title)
        response = await chat(
            step7_diagnosis.SYSTEM_PROMPT,
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


@router.post("/hook")
async def optimize_hook(req: HookRequest):
    """Step 8: Generate 3 opening versions."""
    try:
        user_msg = step8_hook.build_user_message(req.article)
        response = await chat(
            step8_hook.SYSTEM_PROMPT,
            user_msg,
            max_tokens=2048,
            temperature=0.8,
        )
        result = extract_json(response)
        return result
    except json.JSONDecodeError as e:
        raise HTTPException(500, "Failed to parse AI response: " + str(e))
    except Exception as e:
        raise HTTPException(500, type(e).__name__ + ": " + str(e))


@router.post("/ai-check")
async def ai_check(req: AiCheckRequest):
    """Step 9: AI-generated content detection."""
    try:
        print("AI_CHECK: article len=", len(req.article), flush=True)
        user_msg = step9_ai_check.build_user_message(req.article)
        print("AI_CHECK: user_msg len=", len(user_msg), "system len=", len(step9_ai_check.SYSTEM_PROMPT), flush=True)
        response = await chat(
            step9_ai_check.SYSTEM_PROMPT,
            user_msg,
            max_tokens=4096,
            temperature=0.3,
        )
        print("AI_CHECK: response len=", len(response), flush=True)
        result = extract_json(response)
        return result
    except json.JSONDecodeError as e:
        print("AI_CHECK JSON ERROR:", e, flush=True)
        raise HTTPException(500, "Failed to parse AI response: " + str(e))
    except Exception as e:
        print("AI_CHECK ERROR:", type(e).__name__, str(e), flush=True)
        import traceback as tb
        tb.print_exc()
        raise HTTPException(500, type(e).__name__ + ": " + str(e))


FIX_SYSTEM_PROMPT = """你是文章修改专家。根据五维诊断报告逐条修改文章。

修改原则：
1. 优先修改 ❌ 项（必须改），其次 ⚠️ 项（有改进空间）
2. 诊断中指出的具体问题必须在修改中解决
3. 保持文章原有风格和核心观点不变
4. 只做诊断建议的修改，不要添加新内容
5. 直接输出修改后的完整文章，不要解释你改了什么
6. 这是第 {cycle} 轮修改，只改本轮诊断中 ❌ 和 ⚠️ 的问题"""


@router.post("/fix")
async def fix_article(req: FixRequest):
    """Fix article based on diagnosis report, with cycle tracking."""
    try:
        # Build the diagnosis summary for the prompt
        diag = req.diagnosis
        issues_text = ""
        for dim in diag.get("dimensions", []):
            if dim.get("verdict") in ("fail", "warn"):
                issues_text += "\n【" + dim["name"] + "】" + dim["verdict"] + "\n"
                for issue in dim.get("issues", []):
                    issues_text += "  - " + issue + "\n"
                if dim.get("suggestion"):
                    issues_text += "  建议: " + dim["suggestion"] + "\n"

        system_prompt = FIX_SYSTEM_PROMPT.replace("{cycle}", str(req.cycle))
        user_msg = (
            "原标题：" + req.title + "\n\n"
            "原文：\n" + req.article + "\n\n"
            "诊断报告（需修改的项）：\n" + issues_text + "\n\n"
            "请输出修改后的完整文章。"
        )

        response = await chat(system_prompt, user_msg, max_tokens=4096, temperature=0.5)
        return {"article": response, "fixed": True, "cycle": req.cycle}
    except Exception as e:
        raise HTTPException(500, str(e))
