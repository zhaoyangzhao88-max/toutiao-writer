import type { StepNumber, TriggerType } from '../types/workflow';

export interface StepInfo {
  label: string;
  phase: string;
  description: string;
}

export const STEP_LABELS: Record<StepNumber, StepInfo> = {
  1:  { label: '获取素材',   phase: '分析与增补', description: '通过URL、粘贴或搜索获取写作原材料' },
  2:  { label: '好问题引导', phase: '分析与增补', description: '用五个好问题找准切入角度' },
  3:  { label: '素材提炼',   phase: '分析与增补', description: 'AI自动提取核心话题、数据、案例、金句' },
  4:  { label: '概念拆解',   phase: '写作',       description: '拆解模糊概念，替换为具体表达' },
  5:  { label: '生成标题',   phase: '写作',       description: '用8种心理触发器生成高打开率标题' },
  6:  { label: '正文写作',   phase: '写作',       description: 'AI辅助逐段生成正文，实时流式输出' },
  7:  { label: '五维诊断',   phase: '暂停诊断',   description: '从五个维度诊断文章质量，给出修改建议' },
  8:  { label: '开头优化',   phase: '优化',       description: '用数据冲击/悬念/场景沉浸三种方法重写开头' },
  9:  { label: 'AI 检测',    phase: '优化',       description: '检测AI写作痕迹，人工化润色' },
  10: { label: '配图',       phase: '交付',       description: '根据关键词自动搜索配图素材' },
  11: { label: '生成文档',   phase: '交付',       description: '导出为Word文档，含排版和封面' },
  12: { label: '展示发布',   phase: '交付',       description: '预览最终效果，统计字数与阅读时长' },
};

export const PHASES = [
  { name: '分析与增补', steps: [1, 2, 3], color: 'bg-blue-500' },
  { name: '写作',       steps: [4, 5, 6], color: 'bg-purple-500' },
  { name: '暂停诊断',   steps: [7],       color: 'bg-amber-500' },
  { name: '优化',       steps: [8, 9],    color: 'bg-green-500' },
  { name: '交付',       steps: [10, 11, 12], color: 'bg-rose-500' },
];

export const CONFLICT_TYPES = [
  { value: 'data', label: '数据冲突 — 两套数据互相矛盾' },
  { value: 'expectation', label: '期望冲突 — 现实与预期不符' },
  { value: 'behavior', label: '行为冲突 — 说一套做一套' },
  { value: 'resource', label: '资源冲突 — 想要但不够/得不到' },
  { value: 'viewpoint', label: '观点冲突 — 两种立场针锋相对' },
] as const;

export const GENRE_OPTIONS = [
  { value: 'business', label: '商业财经' },
  { value: 'society', label: '社会民生' },
  { value: 'people', label: '人物故事' },
  { value: 'life', label: '生活方式' },
] as const;

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  '认知冲突': '认知冲突 — "你以为的其实都是错的"',
  '好奇缺口': '好奇缺口 — "这件事背后藏着什么"',
  '恐惧损失': '恐惧损失 — "不做这件事你会后悔"',
  '争议挑衅': '争议挑衅 — "这个观点你敢认同吗"',
  '社会证明': '社会证明 — "100万人已经这样做了"',
  '结果承诺': '结果承诺 — "读完这篇文章你能省1万块"',
  '身份代入': '身份代入 — "每一个打工人都应该看看"',
  '数字锚定': '数字锚定 — "3个方法让你的效率翻10倍"',
};

export const FUZZY_WORD_MAP: Record<string, string> = {
  '认知': '以前不知道，现在知道了',
  '底层逻辑': '最根本的原因是',
  'IP': '别人一提到你就想到的事',
  '赛道': '方向',
  '赋能': '让...有能力做...',
  '抓手': '突破口',
  '闭环': '从头到尾做完整',
  '对齐': '商量一致',
  '颗粒度': '细节',
  '痛点': '让人不舒服的地方',
  '场景': '具体在什么情况下',
  '调性': '风格',
  '心智': '脑子里记住的',
  '打法': '怎么做的方法',
  '拉通': '让两边都说清楚',
  '对标': '照着...学',
  '矩阵': '多个账号一起',
  '私域': '自己的粉丝群',
  '复盘': '事后总结',
  '壁垒': '别人抄不了的优势',
};

export const DISABLED_WORDS = [
  '众所周知',
  '近年来',
  '随着...的发展',
  '在...背景下',
  '不可否认',
  '毋庸置疑',
  '显而易见',
  '不言而喻',
  '值得注意的是',
  '令人惊讶的是',
  '不得不提',
  '事实上',
] as const;

export const IMAGE_STYLES = [
  { value: 'humanistic', label: '人文纪实', emoji: '📷' },
  { value: 'sports', label: '运动活力', emoji: '🏃' },
  { value: 'artistic', label: '艺术质感', emoji: '🎨' },
  { value: 'social', label: '社交氛围', emoji: '👥' },
  { value: 'nature', label: '自然风光', emoji: '🌿' },
] as const;

// ============ Step 2: 好问题引导选项 ============

export const AUDIENCE_OPTIONS = [
  { value: 'office_worker', label: '职场打工人', desc: '25-40岁，企业上班，关心职业发展、副业、裁员', emoji: '💼' },
  { value: 'parent', label: '宝爸宝妈', desc: '有0-12岁孩子，关心教育、育儿、家庭财务', emoji: '👶' },
  { value: 'student', label: '大学生/应届生', desc: '18-24岁，关心就业、考研、恋爱、租房', emoji: '🎓' },
  { value: 'entrepreneur', label: '创业/个体户', desc: '自己做生意，关心流量、风口、赚钱机会', emoji: '🚀' },
  { value: 'public_servant', label: '体制内/编制', desc: '公务员、事业单位、国企，关心晋升、体制内生存', emoji: '🏛️' },
  { value: 'retiree', label: '退休/中老年', desc: '50+岁，关心养老、健康、子女、退休金', emoji: '🌅' },
  { value: 'investor', label: '理财投资人群', desc: '炒股、买基金、关注房价，关心钱生钱', emoji: '📈' },
  { value: 'tech_fan', label: '科技数码爱好者', desc: '关注AI、手机、新能源车、科技趋势', emoji: '🤖' },
  { value: 'general', label: '所有人群', desc: '不做细分，社会热点/生活常识通用', emoji: '🌍' },
] as const;

export const GOAL_OPTIONS = [
  { value: 'forward', label: '转发分享', desc: '读者觉得有用/有趣，转发到朋友圈或群聊', emoji: '🔄' },
  { value: 'comment', label: '引发讨论', desc: '看完想在评论区说两句，制造互动', emoji: '💬' },
  { value: 'change_mind', label: '改变观念', desc: '打破原有认知，产生"原来是这样"的感觉', emoji: '💡' },
  { value: 'learn', label: '学到东西', desc: '读完觉得涨知识了，有"以前不知道"的增量信息', emoji: '📚' },
  { value: 'collect', label: '收藏备用', desc: '实用内容，读者想存着以后再看或照着做', emoji: '⭐' },
  { value: 'act', label: '行动驱动', desc: '看完想做某件事——下单、报名、尝试新方法', emoji: '🏃' },
  { value: 'resonate', label: '情感共鸣', desc: '"这说的就是我"，被理解、被看见的感觉', emoji: '❤️' },
  { value: 'anger', label: '激发情绪', desc: '让读者感到不平/愤怒/震撼，情绪驱动传播', emoji: '😤' },
  { value: 'open_eyes', label: '开眼界', desc: '看到不为人知的内幕、冷知识、新趋势', emoji: '👁️' },
] as const;

export const CONFLICT_OPTIONS = [
  { value: 'data', label: '数据冲突', desc: '数据反常、统计矛盾。「都说消费降级，但奢侈品销量暴涨30%」', emoji: '📊' },
  { value: 'expectation', label: '预期冲突', desc: '结果与预期相反。「大家都以为A会赢，结果B赢了」', emoji: '🔄' },
  { value: 'behavior', label: '行为冲突', desc: '说一套做一套。「公司宣传家文化，却优先裁老员工」', emoji: '🎭' },
  { value: 'resource', label: '资源冲突', desc: '分配不均、利益争夺。「月入2万不如县城5千舒服」', emoji: '⚖️' },
  { value: 'viewpoint', label: '观点对立', desc: '不同立场不同结论。「年轻人该不该掏空六个钱包买房」', emoji: '🗣️' },
] as const;

export const CONSTRAINT_OPTIONS = {
  length: [
    { value: 'length_short', label: '1500字轻量版', desc: '快速阅读，碎片时间消费' },
    { value: 'length_medium', label: '3000字标准版', desc: '信息量充足，有深度不冗长' },
    { value: 'length_long', label: '5000字深度版', desc: '全面展开，专业/深度选题' },
  ] as const,
  tone: [
    { value: 'tone_sharp', label: '犀利尖锐', desc: '观点鲜明，敢批评，适合争议话题' },
    { value: 'tone_mild', label: '温和理性', desc: '平衡客观，多方呈现，适合敏感话题' },
    { value: 'tone_story', label: '故事叙事', desc: '讲故事为主，适合人物/经历类' },
    { value: 'tone_data', label: '数据驱动', desc: '数据支撑观点，适合商业/财经类' },
  ] as const,
  timing: [
    { value: 'time_urgent', label: '今天必发', desc: '追热点，时效性第一' },
    { value: 'time_week', label: '本周内', desc: '有时效要求但不急' },
    { value: 'time_evergreen', label: '常青内容', desc: '不追时效，长期可读' },
  ] as const,
  sensitivity: [
    { value: 'sen_none', label: '无限制', desc: '话题安全，可自由发挥' },
    { value: 'sen_policy', label: '涉及政策', desc: '涉及政府/政策，需注意表述' },
    { value: 'sen_company', label: '涉及企业', desc: '点名具体公司，需匿名或谨慎' },
    { value: 'sen_person', label: '涉及个人', desc: '涉及具体人物，需核实事实' },
  ] as const,
} as const;

export const FEEDBACK_OPTIONS = [
  { value: 'views', label: '高阅读量', desc: '目标10万+/50万+阅读', emoji: '👀' },
  { value: 'comments', label: '高评论量', desc: '引发广泛讨论，评论区活跃', emoji: '💬' },
  { value: 'forwards', label: '高转发量', desc: '被大量转发到朋友圈/群聊', emoji: '🔄' },
  { value: 'followers', label: '涨粉', desc: '文章带来新增关注/粉丝', emoji: '📈' },
  { value: 'quote', label: '被引用', desc: '被其他媒体/博主引用或二次传播', emoji: '📰' },
  { value: 'recommend', label: '上推荐', desc: '被平台算法推上热门推荐', emoji: '🔥' },
  { value: 'mind_change', label: '改变认知', desc: '读者反馈"原来如此""学到了"', emoji: '💡' },
  { value: 'action', label: '驱动行动', desc: '读者看完后真的去做了某件事', emoji: '✅' },
] as const;
