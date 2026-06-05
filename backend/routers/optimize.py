"""Optimization router - Steps 7-9: Diagnosis, Hook, AI Check."""
import json
import re
import traceback
from fastapi import APIRouter, HTTPException
from models.schemas import (
    DiagnosisRequest, HookRequest, AiCheckRequest, FixRequest, ApplyCheckFixRequest,
)
from services.claude_client import chat
from services.prompts import step7_diagnosis, step8_hook, step9_ai_check

router = APIRouter()


from services.utils import extract_json


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


APPLY_FIX_PROMPT = """你正在修改一篇文章中的"AI写作痕迹"。请严格按照用户指出的问题位置和修改建议进行修改。

规则：
1. 只修改问题中提到的具体位置的具体文字，不要改动其他任何内容
2. 保持文章其他段落、句子、措辞完全不变
3. 直接输出修改后的完整文章，不要加任何解释
4. 如果修改建议提供了替换方案，优先使用该方案
5. 注意修改建议中提到的具体位置（如哪一段哪一句）"""


@router.post("/apply-check-fix")
async def apply_check_fix(req: ApplyCheckFixRequest):
    """Step 9: Apply a single AI signal fix to the article."""
    try:
        signal = req.signal
        user_msg = (
            "文章正文：\n" + req.article + "\n\n"
            "检测到的问题：\n"
            "- 特征：" + signal.get("feature", "") + "\n"
            "- 描述：" + signal.get("description", "") + "\n"
            "- 位置：" + signal.get("location", "") + "\n"
            "- 修改建议：" + signal.get("suggestion", "") + "\n\n"
            "请根据修改建议，修改文章中的对应部分，输出修改后的完整文章。"
        )
        response = await chat(APPLY_FIX_PROMPT, user_msg, max_tokens=4096, temperature=0.5)
        return {"article": response, "fixed": True}
    except Exception as e:
        raise HTTPException(500, str(e))


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
