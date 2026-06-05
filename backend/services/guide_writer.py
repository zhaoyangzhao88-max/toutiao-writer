"""guide_writer.py — Transform Step 2 guide answers into a Writing Compass.

The Writing Compass is a structured dict with natural-language instructions
that can be injected into any downstream prompt (Steps 4/5/6). This is the
single translation layer between raw user selections and AI-writing strategy.

Usage:
    compass = build_writing_compass(guide_answers)
    if compass:
        prompt += "\\n\\n【写作指南针】\\n" + json.dumps(compass, ensure_ascii=False)
"""

# ── Label maps ─────────────────────────────────────────────────────

AUDIENCE_LABELS = {
    "office_worker": "职场打工人（25-40岁，关心职业发展、副业、裁员、职场政治）",
    "parent": "宝爸宝妈（有0-12岁孩子，关心教育、育儿、家庭财务、学区房）",
    "student": "大学生/应届生（18-24岁，关心就业、考研、恋爱、租房、考公）",
    "entrepreneur": "创业/个体户（关心流量、风口、赚钱机会、商业模型）",
    "public_servant": "体制内/编制（公务员、事业单位、国企——关心政策、稳定、人情世故）",
    "retiree": "退休/中老年（50+岁，关心养老、健康、退休金、子女）",
    "investor": "理财投资人群（炒股、买基金、关注房价、经济趋势）",
    "tech_fan": "科技数码爱好者（关注AI、手机、新能源车、科技趋势）",
    "general": "所有人群（社会热点/生活常识通用——用最大公约数的语言）",
}

GOAL_LABELS = {
    "forward": "转发分享（内容要有社交货币——让读者觉得转发有面子）",
    "comment": "评论区讨论（内容要有争议点或开放问题）",
    "change_mind": '改变观念（内容要有反常识认知——“事实和你以为的不一样”）',
    "learn": "学到东西（每段要有干货增量，结构清晰可回溯）",
    "collect": "收藏备用（内容要有实用价值——清单、方法、数据）",
    "act": "采取行动（内容要促使读者做某事——试试、关注、购买）",
    "resonate": '情感共鸣（内容要触动情绪——“说的就是我”）',
    "anger": "愤怒表达（内容要揭露不公，激发正义感）",
    "open_eyes": "大开眼界（内容要展示读者没见过的东西）",
}

CONFLICT_LABELS = {
    "data": "数据冲突——数据之间存在矛盾，或数据与常识矛盾",
    "expectation": "预期违背——事情发展和大众预期不一样，或过程/结果反转",
    "behavior": "行为矛盾——人的言行不一，嘴上说一套实际做一套",
    "resource": "资源争夺——资源有限/分配不均引发的冲突（钱、地、名额、流量）",
    "viewpoint": "观点对立——两群人/两个人对同一件事看法截然不同",
}

TONE_LABELS = {
    "tone_sharp": "犀利尖锐：观点鲜明，不怕争议，用短句强表态",
    "tone_mild": '温和理性：先说一面再说另一面，平衡客观，用「同时」「不过」承接',
    "tone_story": "故事叙事：以具体人物推进，少说理多展示，注重画面感和情感",
    "tone_data": '数据驱动：每段有数据支撑，不说「很多」说具体数字，保持客观冷静',
}

TIMING_LABELS = {
    "time_urgent": "今天必发——话题时效性强，需快速抓住热点窗口",
    "time_week": "本周内——有一定时效性，但不是必须今日发",
    "time_evergreen": "长期有效——内容不受时效限制，注重厚度和收藏价值",
}

SENSITIVITY_LABELS = {
    "sen_none": "无限制——可大胆表达",
    "sen_policy": "涉及政策话题——表述需注意分寸，避免直接批评政策",
    "sen_company": '涉及具体企业——建议匿名化（用「某公司」）或注意事实准确性',
    "sen_person": "涉及具体人物——需核实事实，避免人身攻击",
}

FEEDBACK_LABELS = {
    "views": "阅读量——标题党风险可控，重点是吸引点击",
    "comments": "高评论量——内容要有争议点和讨论空间，不要把所有结论说死",
    "forwards": '高转发量——中后段设转发触点，激发「我要让朋友也看看」',
    "followers": "涨粉——内容要有系列感/风格辨识度",
    "quote": "被引用——内容需有独创观点或独家数据",
    "recommend": "上推荐——节奏紧凑，完读率高，前200字定生死",
    "mind_change": '改变认知——读者看完后说「我从没这么想过」',
    "action": "促使行动——结尾给出可操作的建议",
}


def build_writing_compass(guide_answers: dict | None) -> dict | None:
    """
    Build a Writing Compass from raw Step 2 GuideAnswers.

    Returns None if no answers are provided, allowing downstream code to
    skip compass injection entirely (backward-compatible with skipped Step 2).
    """
    if not guide_answers:
        return None

    ga = guide_answers  # shorthand
    compass: dict[str, object] = {}

    # ── 1. Audience Profile ───────────────────────────────────────
    audience_key = ga.get("audience")
    audience_note = ga.get("audienceNote", "").strip()
    profiles: list[str] = []
    if audience_key:
        profiles.append(AUDIENCE_LABELS.get(audience_key, audience_key))
    if audience_note:
        profiles.append("补充：" + audience_note)
    if profiles:
        compass["audience_profile"] = "；".join(profiles)

    # ── 2. Reader Goals ───────────────────────────────────────────
    goal_keys = ga.get("goals")
    if isinstance(goal_keys, list) and goal_keys:
        compass["reader_goals"] = [GOAL_LABELS.get(k, k) for k in goal_keys]

    # ── 3. Core Conflict ──────────────────────────────────────────
    conflict_type_key = ga.get("conflictType")
    conflict_text = ga.get("conflict", "").strip()
    parts: list[str] = []
    if conflict_type_key:
        parts.append(CONFLICT_LABELS.get(conflict_type_key, conflict_type_key))
    if conflict_text:
        parts.append("具体描述：" + conflict_text)
    if parts:
        compass["core_conflict"] = "\n".join(parts)

    # ── 4. Tone ───────────────────────────────────────────────────
    tone_key = ga.get("constraintTone")
    if tone_key:
        compass["tone"] = TONE_LABELS.get(tone_key, tone_key)

    # ── 5. Timing Context ─────────────────────────────────────────
    timing_key = ga.get("constraintTiming")
    if timing_key:
        compass["timing"] = TIMING_LABELS.get(timing_key, timing_key)

    # ── 6. Sensitivity Warning ────────────────────────────────────
    sens_key = ga.get("constraintSensitivity")
    if sens_key and sens_key != "sen_none":
        compass["sensitivity_warning"] = SENSITIVITY_LABELS.get(sens_key, sens_key)

    # ── 7. Success Criteria (from feedbacks + goals) ──────────────
    feedback_keys = ga.get("feedbacks")
    criteria: list[str] = []
    if isinstance(feedback_keys, list):
        for fk in feedback_keys:
            criteria.append(FEEDBACK_LABELS.get(fk, fk))
    # Also derive from reader goals
    if compass.get("reader_goals"):
        criteria.extend(compass["reader_goals"])  # type: ignore[arg-type]
    if criteria:
        compass["success_criteria"] = criteria

    # ── 8. Writing Guide — synthesised natural-language instructions ──
    guide_parts: list[str] = []

    # 8a. Audience adaptation
    if audience_key:
        guide_parts.append(
            f"- 目标读者：{AUDIENCE_LABELS.get(audience_key, audience_key)}。"
            f"全文使用他们关心的角度和熟悉的语言。"
        )

    # 8b. Conflict thread
    if conflict_type_key:
        conflict_short = CONFLICT_LABELS.get(conflict_type_key, conflict_type_key)
        if "-" in conflict_short:
            conflict_short = conflict_short.split("-", 1)[1].strip()
        guide_parts.append(
            f"- 核心矛盾：{conflict_short}。全文围绕这一矛盾展开——"
            f"开头引入制造张力，中段深化提供证据，结尾回应给出观点。"
        )

    # 8c. Tone prescription
    if tone_key:
        tone_short = TONE_LABELS.get(tone_key, "")
        if "-" in tone_short:
            tone_desc = tone_short.split("-", 1)[1].strip()
            guide_parts.append(f"- 语气控制：{tone_desc}。全文统一遵循此语气。")

    # 8d. Emotional pacing
    goal_keys_list = ga.get("goals")
    if isinstance(goal_keys_list, list) and goal_keys_list:
        if "resonate" in goal_keys_list:
            guide_parts.append(
                '- 情绪设计：注重情感共鸣——中段设触点，让读者觉得「说的就是我」。'
            )
        if "change_mind" in goal_keys_list:
            guide_parts.append(
                '- 情绪设计：中段设认知反转——「事实和你以为的不一样」。'
            )
        if "forward" in goal_keys_list:
            guide_parts.append(
                '- 情绪设计：中后段设转发触点——激发「我要让朋友也看看」。'
            )

    # 8e. Sensitivity guard
    if sens_key == "sen_policy":
        guide_parts.append("- 注意：涉及政策话题，表述需注意分寸，避免直接批评。")
    elif sens_key == "sen_company":
        guide_parts.append('- 注意：涉及具体企业，建议匿名化为「某公司」，确保事实准确性。')
    elif sens_key == "sen_person":
        guide_parts.append("- 注意：涉及具体人物，需核实事实，避免主观评价。")

    # 8f. Custom constraint note
    constraint_note = ga.get("constraintNote", "").strip()
    if constraint_note:
        guide_parts.append(f"- 特殊约束：{constraint_note}")

    if guide_parts:
        compass["writing_guide"] = "\n".join(guide_parts)

    # ── Remove empty buckets ──────────────────────────────────────
    return {k: v for k, v in compass.items() if v is not None and v != "" and v != []}
