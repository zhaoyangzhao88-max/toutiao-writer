import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type FC,
} from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { StatusIcon } from '../ui/StatusIcon';
import { ProgressBar } from '../ui/ProgressBar';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { writingApi } from '../../lib/api';
import { DISABLED_WORDS } from '../../lib/constants';
import type {
  PreWriteChecklist,
  EmotionMap,
} from '../../types/workflow';

/* ------------------------------------------------------------------ */
/*  Pre-write checklist item data                                      */
/* ------------------------------------------------------------------ */

interface ChecklistItemData {
  key: keyof PreWriteChecklist;
  emoji: string;
  label: string;
  prompt: string;
}

const CHECKLIST_ITEMS: ChecklistItemData[] = [
  {
    key: 'wordHygiene',
    emoji: '🧹',
    label: '文字洁癖',
    prompt: '口语感自然吗？有排比堆叠吗？',
  },
  {
    key: 'titleQuality',
    emoji: '🎟️',
    label: '标题质量',
    prompt: '有数字/冲突/好奇心吗？0.5秒能抓住注意力吗？',
  },
  {
    key: 'expressionEfficiency',
    emoji: '⚡',
    label: '表达效率',
    prompt: '前100字进主题了吗？每300字有新信息吗？',
  },
  {
    key: 'cognitiveGap',
    emoji: '🧠',
    label: '认知落差',
    prompt: '读者看完有\'以前不知道的\'吗？',
  },
  {
    key: 'aiAssistance',
    emoji: '🤖',
    label: 'AI 辅助度',
    prompt: '有自己的真实经验/判断/犹豫吗？',
  },
];

/* ------------------------------------------------------------------ */
/*  Emotion map data                                                   */
/* ------------------------------------------------------------------ */

interface EmotionArcStep {
  phase: string;
  emotion: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

const EMOTION_ARC: EmotionArcStep[] = [
  {
    phase: '开头',
    emotion: '紧张·好奇·震惊',
    color: 'orange',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-300',
    textClass: 'text-orange-700',
  },
  {
    phase: '中段1',
    emotion: '共鸣·认同',
    color: 'amber',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-700',
  },
  {
    phase: '中段2',
    emotion: '反转·冲击',
    color: 'rose',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-300',
    textClass: 'text-rose-700',
  },
  {
    phase: '高潮',
    emotion: '愤怒·感动',
    color: 'red',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-300',
    textClass: 'text-red-700',
  },
  {
    phase: '结尾',
    emotion: '回味·讨论欲',
    color: 'purple',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-300',
    textClass: 'text-purple-700',
  },
];

/* ------------------------------------------------------------------ */
/*  Writing rules data                                                 */
/* ------------------------------------------------------------------ */

const WRITING_RULES: string[] = [
  '开头前50字有画面/数据/冲突',
  '第一段给核心结论',
  '每段≤80字，关键句单独成段',
  '每500字设钩子',
  '数据要具体',
  '用“你”“我”“我们”',
  '禁用：众所周知、近年来、随着发展',
  '结尾用开放问题',
  '“不是X是Y”不超过2次',
  '小标题用【】代替冒号',
];

/* ------------------------------------------------------------------ */
/*  Emotion map skeleton (placeholder defaults)                         */
/* ------------------------------------------------------------------ */

const DEFAULT_EMOTION_MAP: EmotionMap = {
  opening: '紧张·好奇·震惊',
  mid1: '共鸣·认同',
  mid2: '反转·冲击',
  climax: '愤怒·感动',
  ending: '回味·讨论欲',
};

/* ------------------------------------------------------------------ */
/*  Typing indicator                                                    */
/* ------------------------------------------------------------------ */

const TypingDots: FC = () => (
  <span className="inline-flex items-center gap-1 ml-1">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
    <span
      className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"
      style={{ animationDelay: '150ms' }}
    />
    <span
      className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"
      style={{ animationDelay: '300ms' }}
    />
  </span>
);

/* ------------------------------------------------------------------ */
/*  Toolbar button helper                                               */
/* ------------------------------------------------------------------ */

interface ToolbarBtnProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
}

const ToolbarBtn: FC<ToolbarBtnProps> = ({ active, onClick, label, icon }) => {
  const base =
    'px-2.5 py-1.5 text-sm rounded transition-colors duration-150 focus:outline-none';
  const activeClass = active
    ? 'bg-blue-100 text-blue-700'
    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800';

  return (
    <button
      type="button"
      className={base + ' ' + activeClass}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
    >
      {icon}
    </button>
  );
};

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

const Step6Editor: FC = () => {
  /* ----- store ----- */
  const {
    preWriteChecklist,
    setPreWriteChecklist,
    article,
    setArticle,
    appendArticleToken,
    emotionMap,
    setEmotionMap,
    selectedTitle,
    fetchedContent,
    rawInput,
    guideAnswers,
    materialCard,
    deconstructResult,
    goNext,
    goPrev,
    completeStep,
  } = useWorkflowStore();

  /* ----- local UI state ----- */
  const [checklistCollapsed, setChecklistCollapsed] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ----- derived data ----- */
  const rawMaterial = fetchedContent?.content || rawInput || '';
  const title = selectedTitle || '';

  /* Map constraintLength to actual word count */
  const getWordCount = useCallback((): number => {
    const len = guideAnswers?.constraintLength;
    if (len === 'length_short') return 1500;
    if (len === 'length_long') return 5000;
    return 3000; // length_medium or undefined
  }, [guideAnswers]);

  const initialChecklist: PreWriteChecklist = preWriteChecklist || {
    wordHygiene: false,
    titleQuality: false,
    expressionEfficiency: false,
    cognitiveGap: false,
    aiAssistance: false,
  };

  const [localChecklist, setLocalChecklist] =
    useState<PreWriteChecklist>(initialChecklist);

  const initialEmotion: EmotionMap = emotionMap || DEFAULT_EMOTION_MAP;
  const [localEmotionMap] = useState<EmotionMap>(initialEmotion);

  /* ----- derived helpers ----- */
  const checklistChecked = useMemo(
    () => Object.values(localChecklist).filter(Boolean).length,
    [localChecklist],
  );

  const checklistProgress = useMemo(
    () => Math.round((checklistChecked / 5) * 100),
    [checklistChecked],
  );

  const allChecked = checklistChecked === 5;

  /* ----- TipTap editor ----- */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: '开始写作，或用 AI 生成...',
      }),
    ],
    content: article || '',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[400px] px-6 py-4 focus:outline-none text-gray-800 leading-relaxed',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const text = ed.getText();
      if (text.trim().length === 0 && !html.includes('<img')) {
        setArticle('');
      } else {
        setArticle(html);
      }
    },
  });

  /* keep external article changes in sync (e.g. SSE appending) */
  const lastArticleRef = useRef(article);
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (article !== undefined && article !== lastArticleRef.current && article !== currentHtml) {
      editor.commands.setContent(article, false);
    }
    lastArticleRef.current = article;
  }, [article, editor]);

  /* ----- checklist handlers ----- */
  const toggleChecklistItem = useCallback(
    (key: keyof PreWriteChecklist) => {
      setLocalChecklist((prev) => {
        const next = { ...prev, [key]: !prev[key] };
        setPreWriteChecklist(next);
        return next;
      });
    },
    [setPreWriteChecklist],
  );

  /* ----- emotion map ----- */
  const emotionArcForRender = useMemo(() => {
    return EMOTION_ARC.map((arc, idx) => {
      const mapKeys: (keyof EmotionMap)[] = [
        'opening',
        'mid1',
        'mid2',
        'climax',
        'ending',
      ];
      return {
        ...arc,
        detail: localEmotionMap[mapKeys[idx]] || arc.emotion,
      };
    });
  }, [localEmotionMap]);

  /* ----- SSE article stream ----- */
  const handleAiGenerate = useCallback(async () => {
    if (!title) {
      setError('请先在步骤5中选择一个标题');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await writingApi.articleStream({
        title,
        material_card: materialCard || {},
        deconstruct_result: deconstructResult || {},
        word_count: getWordCount(),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'SSE 连接失败');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('浏览器不支持流式读取');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') {
            setLoading(false);
            return;
          }

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === 'token' && parsed.content) {
              appendArticleToken(parsed.content);
            } else if (parsed.type === 'error') {
              setError(parsed.error || '生成出错');
              setLoading(false);
              return;
            }
          } catch {
            /* skip unparseable chunks */
          }
        }
      }

      setLoading(false);
    } catch (err: unknown) {
      /* SSE fallback — try non-streaming */
      const message =
        err instanceof Error ? err.message : '未知错误';
      try {
        const res = await writingApi.article({
          title,
          material_card: materialCard || {},
          deconstruct_result: deconstructResult || {},
          word_count: getWordCount(),
        });
        if (res.success && res.data) {
          const data = res.data as { article?: string };
          if (data.article) {
            setArticle(data.article);
          } else {
            setError('生成失败，返回数据为空');
          }
        } else {
          setError(res.error || message);
        }
      } catch (fallbackErr: unknown) {
        const fbMsg =
          fallbackErr instanceof Error
            ? fallbackErr.message
            : '网络错误';
        setError(message + ' | 降级方案也失败: ' + fbMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [
    title,
    materialCard,
    deconstructResult,
    appendArticleToken,
    setArticle,
    getWordCount,
  ]);

  /* ----- save draft ----- */
  const handleSaveDraft = useCallback(() => {
    if (editor) {
      const html = editor.getHTML();
      setArticle(html);
    }
    setPreWriteChecklist(localChecklist);
    /* could also persist to localStorage / backend here */
    alert('草稿已保存');
  }, [editor, setArticle, setPreWriteChecklist, localChecklist]);

  /* ----- go to diagnostics ----- */
  const handleGoDiagnose = useCallback(() => {
    if (editor) {
      const html = editor.getHTML();
      setArticle(html);
    }
    setPreWriteChecklist(localChecklist);
    completeStep(6);
    goNext();
  }, [editor, setArticle, setPreWriteChecklist, localChecklist, completeStep, goNext]);

  /* ----- mobile preview ----- */
  const articleText = article || '';

  /* ----- word count ----- */
  const wordCount = useMemo(() => {
    if (!articleText) return 0;
    const div = document.createElement('div');
    div.innerHTML = articleText;
    const text = div.textContent || div.innerText || '';
    return text.replace(/\s+/g, '').length;
  }, [articleText]);

  /* ================================================================== */
  /*  RENDER                                                             */
  /* ================================================================== */

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5">
      {/* ---------- Header ---------- */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            正文写作
          </h2>
          <p className="text-sm text-gray-500">
            AI辅助逐段生成正文，支持流式输出和富文本编辑
          </p>
        </div>
        {selectedTitle && (
          <Badge variant="info">
            {'已选标题: ' + selectedTitle.slice(0, 25) +
              (selectedTitle.length > 25 ? '...' : '')}
          </Badge>
        )}
      </div>

      {/* ---------- Two-column layout ---------- */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* ============ LEFT COLUMN ============ */}
        <aside className="w-full lg:w-80 flex-shrink-0 space-y-4">
          {/* ---- Pre-write checklist ---- */}
          <Card padding="sm">
            <button
              type="button"
              className="w-full flex items-center justify-between mb-3"
              onClick={() => setChecklistCollapsed(!checklistCollapsed)}
            >
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>{'✅'}</span>
                <span>写前检查清单</span>
                <span className="text-xs text-gray-400 font-normal">
                  {'(' + checklistChecked + '/5)'}
                </span>
              </span>
              <span className="text-xs text-gray-400 transition-transform duration-200">
                {checklistCollapsed ? '▶' : '▼'}
              </span>
            </button>

            {!checklistCollapsed && (
              <>
                <ProgressBar
                  value={checklistProgress}
                  color={allChecked ? 'green' : 'blue'}
                  className="mb-3"
                />

                <div className="space-y-2">
                  {CHECKLIST_ITEMS.map((item) => {
                    const checked = localChecklist[item.key];
                    return (
                      <label
                        key={item.key}
                        className={
                          'flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors duration-150 ' +
                          (checked
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-gray-50 border border-gray-100 hover:border-gray-200')
                        }
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleChecklistItem(item.key)}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">{item.emoji}</span>
                            <span className="text-xs font-medium text-gray-800">
                              {item.label}
                            </span>
                            <StatusIcon
                              status={checked ? 'pass' : 'warn'}
                              className="text-xs ml-auto flex-shrink-0"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                            {item.prompt}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </Card>

          {/* ---- Emotion Map ---- */}
          <Card padding="sm">
            <div className="flex items-center gap-2 mb-3">
              <span>{'🎭'}</span>
              <span className="text-sm font-semibold text-gray-700">
                情绪地图
              </span>
            </div>

            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              文章情感曲线，从左到右依次为开头到结尾
            </p>

            <div className="space-y-2">
              {emotionArcForRender.map((arc, idx) => (
                <div
                  key={arc.phase}
                  className={
                    'relative pl-4 border-l-2 py-2 pr-2 rounded-r-lg ' +
                    arc.borderClass +
                    ' ' +
                    arc.bgClass
                  }
                >
                  {/* step number dot */}
                  <span
                    className={
                      'absolute -left-2 top-3 w-3.5 h-3.5 rounded-full border-2 border-white ' +
                      arc.borderClass.replace('border-', 'bg-')
                    }
                  />

                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={
                        'text-xs font-semibold ' + arc.textClass
                      }
                    >
                      {arc.phase}
                    </span>
                    <span
                      className={
                        'text-[10px] uppercase tracking-wider opacity-60 ' +
                        arc.textClass
                      }
                    >
                      {idx === 0
                        ? '起点'
                        : idx === 4
                          ? '终点'
                          : '转折'}
                    </span>
                  </div>
                  <p
                    className={
                      'text-xs leading-relaxed ' + arc.textClass +
                      ' opacity-80'
                    }
                  >
                    {arc.detail}
                  </p>
                </div>
              ))}
            </div>

            {/* gradient legend */}
            <div className="mt-3 h-1.5 rounded-full bg-gradient-to-r from-orange-300 via-amber-300 via-rose-400 via-red-400 to-purple-400" />
          </Card>
        </aside>

        {/* ============ RIGHT COLUMN ============ */}
        <section className="flex-1 min-w-0 space-y-4">
          {/* ---- AI Generate bar ---- */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="primary"
              size="md"
              loading={loading}
              onClick={handleAiGenerate}
            >
              {'🤖 AI 生成正文'}
            </Button>

            {loading && (
              <span className="text-sm text-blue-600 flex items-center gap-1.5">
                <span>AI 正在写作</span>
                <TypingDots />
              </span>
            )}

            {!loading && article && (
              <span className="text-xs text-gray-400">
                {'字数: ' + wordCount + ' 字'}
              </span>
            )}
          </div>

          {/* ---- Error banner ---- */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800 flex items-start gap-2">
              <span className="flex-shrink-0">{'⚠️'}</span>
              <span>{error}</span>
              <button
                type="button"
                className="ml-auto text-red-500 hover:text-red-700 flex-shrink-0"
                onClick={() => setError(null)}
                aria-label="关闭错误提示"
              >
                {'✕'}
              </button>
            </div>
          )}

          {/* ---- Empty state ---- */}
          {!article && !loading && (
            <Card padding="lg" className="text-center">
              <div className="text-5xl mb-4">{'✍️'}</div>
              <h3 className="text-base font-semibold text-gray-700 mb-2">
                开始写作
              </h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                点击上方「AI 生成正文」按钮，AI 将根据你的素材和标题自动生成文章。
                你也可以直接在编辑器中手动输入。
              </p>
              {!selectedTitle && (
                <p className="text-xs text-amber-600 mt-3 bg-amber-50 inline-block px-3 py-1.5 rounded-lg">
                  {'⚠️ 提示：请先在步骤5中选择一个标题'}
                </p>
              )}
            </Card>
          )}

          {/* ---- TipTap Editor (shown when mobile preview off) ---- */}
          {!mobilePreview && (
            <Card padding="none" className="overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 bg-gray-50/80 flex-wrap">
                <ToolbarBtn
                  active={editor?.isActive('bold') ?? false}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  label="加粗"
                  icon="B"
                />
                <ToolbarBtn
                  active={editor?.isActive('italic') ?? false}
                  onClick={() =>
                    editor?.chain().focus().toggleItalic().run()
                  }
                  label="斜体"
                  icon="I"
                />
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <ToolbarBtn
                  active={
                    editor?.isActive('heading', { level: 2 }) ?? false
                  }
                  onClick={() =>
                    editor
                      ?.chain()
                      .focus()
                      .toggleHeading({ level: 2 })
                      .run()
                  }
                  label="标题"
                  icon="H2"
                />
                <ToolbarBtn
                  active={
                    editor?.isActive('heading', { level: 3 }) ?? false
                  }
                  onClick={() =>
                    editor
                      ?.chain()
                      .focus()
                      .toggleHeading({ level: 3 })
                      .run()
                  }
                  label="副标题"
                  icon="H3"
                />
                <div className="w-px h-5 bg-gray-200 mx-1" />
                <ToolbarBtn
                  active={editor?.isActive('bulletList') ?? false}
                  onClick={() =>
                    editor?.chain().focus().toggleBulletList().run()
                  }
                  label="列表"
                  icon={'• List'}
                />
                <div className="flex-1" />

                {/* Mobile preview toggle */}
                <button
                  type="button"
                  className={
                    'px-2.5 py-1.5 text-sm rounded transition-colors duration-150 focus:outline-none ' +
                    (mobilePreview
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700')
                  }
                  onClick={() => setMobilePreview(!mobilePreview)}
                  title="手机预览"
                  aria-label="切换手机预览"
                >
                  {'📱'}
                </button>
              </div>

              {/* Editor content */}
              <EditorContent editor={editor} />
            </Card>
          )}

          {/* ---- Mobile preview ---- */}
          {mobilePreview && (
            <div className="flex justify-center">
              <div className="w-[375px] bg-white rounded-2xl shadow-xl border border-gray-300 overflow-hidden">
                {/* Phone frame top bar */}
                <div className="bg-gray-800 h-10 flex items-center justify-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-600" />
                  <div className="w-12 h-1.5 rounded-full bg-gray-600" />
                </div>
                {/* Preview content */}
                <div className="p-5 text-sm text-gray-800 leading-relaxed max-h-[600px] overflow-y-auto">
                  {article ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: article }}
                    />
                  ) : (
                    <p className="text-gray-400 italic text-center py-16">
                      暂无内容，请先生成或输入正文
                    </p>
                  )}
                </div>
                {/* Phone frame bottom */}
                <div className="bg-gray-800 h-8 flex items-center justify-center">
                  <div className="w-8 h-1 rounded-full bg-gray-500" />
                </div>
              </div>
            </div>
          )}

          {/* ---- Writing rules card (collapsible) ---- */}
          <Card padding="sm">
            <button
              type="button"
              className="w-full flex items-center justify-between"
              onClick={() => setRulesOpen(!rulesOpen)}
            >
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span>{'📝'}</span>
                <span>头条写作10条铁律</span>
              </span>
              <span className="text-xs text-gray-400 transition-transform duration-200">
                {rulesOpen ? '▼' : '▶'}
              </span>
            </button>

            {rulesOpen && (
              <div className="mt-3 space-y-1.5">
                {WRITING_RULES.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed py-1"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{rule}</span>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    禁用词提醒：{' '}
                    {DISABLED_WORDS.slice(0, 5).join(' / ')}
                    {' ...'}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </section>
      </div>

      {/* ---------- Bottom actions ---------- */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <Button variant="ghost" size="md" onClick={goPrev}>
          上一步
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleSaveDraft}
          >
            保存草稿
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleGoDiagnose}
          >
            {'进入诊断 →'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step6Editor;
