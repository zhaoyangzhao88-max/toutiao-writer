import React, { useState, useCallback, useEffect, type FC } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { optimizeApi } from '../../lib/api';
import type {
  HookVersion,
  HookMethod,
} from '../../types/workflow';

/* ------------------------------------------------------------------ */
/*  Hook method metadata                                                */
/* ------------------------------------------------------------------ */

interface HookMethodMeta {
  method: HookMethod;
  emoji: string;
  label: string;
  subtitle: string;
  description: string;
}

var HOOK_METHODS: HookMethodMeta[] = [
  {
    method: 'data_impact',
    emoji: '\u{1F4CA}',
    label: '数据冲击型',
    subtitle: '开头 A',
    description: '提取文章中最爆炸的数据或案例，直接砸在读者脸上',
  },
  {
    method: 'suspense',
    emoji: '\u{1F3AD}',
    label: '悬念制造型',
    subtitle: '开头 B',
    description: '先藏住结论，用问题或反常现象制造好奇缺口',
  },
  {
    method: 'scene_immersion',
    emoji: '\u{1F3AC}',
    label: '场景代入型',
    subtitle: '开头 C',
    description: '让读者产生"说的就是我"的代入感，从生活场景切入',
  },
];

var METHOD_COLORS: Record<HookMethod, { border: string; bg: string; badge: string; ring: string }> = {
  data_impact: { border: 'border-blue-200', bg: 'bg-blue-50/60', badge: 'bg-blue-100 text-blue-700', ring: 'ring-2 ring-blue-500 border-blue-400' },
  suspense: { border: 'border-purple-200', bg: 'bg-purple-50/60', badge: 'bg-purple-100 text-purple-700', ring: 'ring-2 ring-purple-500 border-purple-400' },
  scene_immersion: { border: 'border-green-200', bg: 'bg-green-50/60', badge: 'bg-green-100 text-green-700', ring: 'ring-2 ring-green-500 border-green-400' },
};

/* ------------------------------------------------------------------ */
/*  Six-dimension check labels                                          */
/* ------------------------------------------------------------------ */

interface CheckLabel {
  key: string;
  label: string;
  description: string;
}

var SIX_CHECKS: CheckLabel[] = [
  { key: 'independence', label: '独立性', description: '不看标题能读懂吗？' },
  { key: 'hook', label: 'Hook', description: '0.5秒能抓住注意力吗？' },
  { key: 'suspense', label: '悬念', description: '答案藏住了吗？' },
  { key: 'credibility', label: '可信度', description: '为什么信你说的话？' },
  { key: 'oralFriendly', label: '口播友好', description: '念出来顺口吗？' },
  { key: 'matching', label: '匹配度', description: '正文兑现了开头的承诺吗？' },
];

/* ------------------------------------------------------------------ */
/*  Skeleton loading cards                                              */
/* ------------------------------------------------------------------ */

var SkeletonHookCard: FC = function () {
  return (
    <div className="border border-gray-200 rounded-xl p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
      <div className="h-4 bg-gray-200 rounded w-12 mb-4" />
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="space-y-1.5">
        {[0, 1, 2, 3, 4, 5].map(function (i) {
          return (
            <div key={i} className="h-2.5 bg-gray-200 rounded w-full" />
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Check grid                                                           */
/* ------------------------------------------------------------------ */

var CheckGrid: FC<{ checks: HookVersion['sixChecks'] }> = function ({ checks }) {
  return (
    <div className="space-y-1.5">
      {SIX_CHECKS.map(function (check) {
        var passed = checks[check.key as keyof typeof checks];
        return (
          <div
            key={check.key}
            className={'flex items-center gap-2 px-2 py-1 rounded text-xs ' + (passed ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-400')}
            title={check.description}
          >
            <span className="flex-shrink-0">
              {passed ? '✅' : '⬜'}
            </span>
            <span className={'font-medium ' + (passed ? '' : 'line-through')}>
              {check.label}
            </span>
            <span className="ml-auto text-[10px] opacity-70 truncate">
              {check.description}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Hook version card                                                    */
/* ------------------------------------------------------------------ */

interface HookVersionCardProps {
  version: HookVersion;
  meta: HookMethodMeta;
  isSelected: boolean;
  onSelect: () => void;
}

var HookVersionCard: FC<HookVersionCardProps> = function ({ version, meta, isSelected, onSelect }) {
  var colors = METHOD_COLORS[meta.method];
  var baseClass = 'border rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 w-full text-left';
  var selectedClass = isSelected ? ' bg-white shadow-lg' : ' bg-white';
  var borderClass = isSelected ? ' border-blue-400 ring-2 ring-blue-500' : ' border-gray-200 hover:border-gray-300';
  var mergedClass = baseClass + selectedClass + ' ' + borderClass;

  return (
    <button
      type="button"
      className={mergedClass}
      onClick={onSelect}
      onKeyDown={function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-label={'选择开头 ' + meta.subtitle + '：' + meta.label}
      aria-pressed={isSelected}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg" role="img" aria-label={meta.label}>
          {meta.emoji}
        </span>
        <div className="flex items-center gap-1.5">
          {version.recommended && (
            <span
              className="text-amber-500 text-sm"
              role="img"
              aria-label="推荐"
              title="推荐此版本"
            >
              {'⭐'}
            </span>
          )}
          {isSelected && (
            <span
              className="text-blue-500 text-sm"
              role="img"
              aria-label="已选中"
            >
              {'✅'}
            </span>
          )}
        </div>
      </div>

      <div className="mb-2">
        <span className={'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ' + colors.badge}>
          {meta.subtitle}
        </span>
        <h3 className="text-sm font-semibold text-gray-800 mt-1">
          {meta.label}
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">
          {meta.description}
        </p>
      </div>

      {/* Opening text */}
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-3">
        <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-line">
          {version.text || '（无内容）'}
        </p>
      </div>

      {/* Six-dimension check grid */}
      <div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
          六维检查
        </p>
        <CheckGrid checks={version.sixChecks} />
      </div>
    </button>
  );
};

/* ------------------------------------------------------------------ */
/*  Main component                                                       */
/* ------------------------------------------------------------------ */

var Step8Hook: FC = function () {
  var store = useWorkflowStore();
  var article = store.article;
  var hookVersions = store.hookVersions;
  var selectedHook = store.selectedHook;
  var setHookVersions = store.setHookVersions;
  var setSelectedHook = store.setSelectedHook;
  var setArticle = store.setArticle;
  var completeStep = store.completeStep;
  var goNext = store.goNext;
  var goPrev = store.goPrev;

  var [loading, setLoading] = useState(false);
  var [error, setError] = useState<string | null>(null);
  var [generated, setGenerated] = useState(hookVersions != null && hookVersions.length > 0);
  var [selected, setSelected] = useState<string>(selectedHook || '');
  var [customHook, setCustomHook] = useState('');

  var localVersions = hookVersions || [];
  var hasVersions = localVersions.length > 0;
  var hasSelection = selected.length > 0 || customHook.trim().length > 0;

  /* Extract opening (first ~200 characters) from article */
  var getOpeningText = useCallback(function (): string {
    if (!article) return '';
    var div = document.createElement('div');
    div.innerHTML = article;
    var text = div.textContent || div.innerText || '';
    return text.slice(0, 300).trim();
  }, [article]);

  /* Normalize method name from AI (may return dataImpact instead of data_impact) */
  var normalizeMethod = function (method: string): string {
    var map: Record<string, string> = {
      'data_impact': 'data_impact',
      'dataimpact': 'data_impact',
      'data-impact': 'data_impact',
      'scene_immersion': 'scene_immersion',
      'sceneimmersion': 'scene_immersion',
      'scene-immersion': 'scene_immersion',
      'suspense': 'suspense',
    };
    return map[method.toLowerCase()] || method;
  };

  /* Generate hook versions */
  var handleGenerate = useCallback(async function () {
    if (!article || !article.trim()) {
      setError('请先在 Step 6 中生成或输入文章正文');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      var res = await optimizeApi.hook({ article: article });
      if (res.success && res.data) {
        var data = res.data as unknown as { versions?: HookVersion[]; hookVersions?: HookVersion[] };
        var versions = data.versions || data.hookVersions || [];
        if (Array.isArray(versions) && versions.length > 0) {
          // Normalize method names from AI
          var normalized = versions.map(function (v) {
            return { ...v, method: normalizeMethod(v.method) as HookMethod };
          });
          setHookVersions(normalized);
          setGenerated(true);
        } else {
          setError('生成开头版本失败，返回数据为空');
        }
      } else {
        setError(res.error || '生成开头版本失败，请稍后重试');
      }
    } catch (_err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [article, setHookVersions]);

  /* Auto-generate on mount when coming from Step 7 */
  useEffect(function () {
    if (article && article.trim() && !hookVersions && !error) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Select a hook version */
  var handleSelect = function (method: HookMethod) {
    setSelected(method);
    setCustomHook('');
    setSelectedHook(method);
  };

  /* Custom hook text change */
  var handleCustomChange = function (e: React.ChangeEvent<HTMLTextAreaElement>) {
    setCustomHook(e.target.value);
    if (e.target.value.trim().length > 0) {
      setSelected('');
    }
  };

  /** Replace first paragraph in article HTML with the hook text. */
  var applyHookToArticle = function (hookText: string): string {
    if (!article) return '<p>' + hookText + '</p>';
    // Split hook text into paragraphs by double newline
    var paragraphs = hookText.split(/\n\n+/).map(function (p) { return p.trim(); }).filter(Boolean);
    var hookHtml = paragraphs.map(function (p) { return '<p>' + p + '</p>'; }).join('\n');

    // Replace the first <p>...</p> in the article HTML
    var result = article.replace(/<p>[\s\S]*?<\/p>/, hookHtml);
    if (result === article) {
      // No <p> found — prepend the hook
      result = hookHtml + '\n' + article;
    }
    return result;
  };

  /* Confirm: write selected hook into article, then go to Step 9 */
  var handleConfirm = function () {
    var finalSelection = selected || customHook.trim();
    if (!finalSelection) return;

    // Find the selected version's text
    var selectedVersion = localVersions.find(function (v) { return v.method === selected; });
    var hookText = selectedVersion?.text || customHook.trim();
    if (hookText) {
      var updatedArticle = applyHookToArticle(hookText);
      setArticle(updatedArticle);
    }

    setSelectedHook(finalSelection);
    completeStep(8);
    goNext();
  };

  /* Render empty state */
  var renderEmpty = function () {
    return (
      <Card padding="lg">
        <div className="text-center py-8">
          <span className="text-5xl">{'\u{1F4DD}'}</span>
          <h3 className="text-lg font-semibold text-gray-800 mt-3 mb-1">
            尚未生成开头版本
          </h3>
          <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
            点击上方按钮，AI 将用数据冲击、悬念制造、场景代入三种方法重写你的开头。
            开头 = 话题 + Hook + 可信度。
          </p>
          {!article && (
            <p className="text-xs text-amber-600 mt-3 bg-amber-50 inline-block px-3 py-1.5 rounded-lg">
              {'⚠️ 提示：请先在 Step 6 中生成或输入文章正文'}
            </p>
          )}
        </div>
      </Card>
    );
  };

  /* Render loading state */
  var renderLoading = function () {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map(function (i) {
          return <SkeletonHookCard key={i} />;
        })}
      </div>
    );
  };

  /* Find version by method */
  var getVersionByMethod = function (method: HookMethod): HookVersion | undefined {
    return localVersions.find(function (v) { return v.method === method; });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Step 8：开头优化
        </h2>
        <p className="text-sm text-gray-500">
          开头 = 话题 + Hook + 可信度。用三种方法重写开头，选一个最狠的
        </p>
      </div>

      {/* Article info banner */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3 text-sm">
        <span className="text-gray-500 flex-shrink-0">{'\u{1F4C4}'}</span>
        <span className="text-gray-600">
          {article
            ? '文章共 ' + article.replace(/<[^>]*>/g, '').replace(/\s+/g, '').length + ' 字'
            : '暂无文章内容'}
        </span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-500 text-xs">
          {'开头片段: ' + getOpeningText().slice(0, 40) + '...'}
        </span>
      </div>

      {/* Generate button area */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {generated && hasVersions && (
            <Badge variant="success">
              {'已生成 ' + localVersions.length + ' 个开头版本'}
            </Badge>
          )}
          {!generated && !loading && (
            <span className="text-sm text-gray-400">
              点击右侧按钮生成三种开头
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {generated && hasVersions && !loading && (
            <Button
              variant="ghost"
              size="md"
              onClick={handleGenerate}
            >
              重新生成
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            loading={loading}
            disabled={!article || !article.trim()}
            onClick={handleGenerate}
          >
            {'\u{1F4DD} 生成开头版本'}
          </Button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 flex items-start gap-2">
          <span className="flex-shrink-0">{'⚠️'}</span>
          <span>{error}</span>
          <button
            type="button"
            className="ml-auto text-red-500 hover:text-red-700 flex-shrink-0"
            onClick={function () { setError(null); }}
            aria-label="关闭错误提示"
          >
            {'✕'}
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && renderLoading()}

      {/* Empty state */}
      {!loading && !hasVersions && !error && renderEmpty()}

      {/* Hook version columns */}
      {!loading && hasVersions && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>{'\u{1F3AF}'}</span>
            <span>三个开头版本</span>
            <span className="text-xs text-gray-400 font-normal">
              点击卡片选择
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {HOOK_METHODS.map(function (meta) {
              var version = getVersionByMethod(meta.method);
              if (!version) return null;
              var isSelected = selected === meta.method;
              return (
                <HookVersionCard
                  key={meta.method}
                  version={version}
                  meta={meta}
                  isSelected={isSelected}
                  onSelect={function () { handleSelect(meta.method); }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Hint text */}
      {hasVersions && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-800">
            {'💡 选一个，或说"用 A，但加点 B 的感觉"——你可以在下方自定义混合版本'}
          </p>
        </div>
      )}

      {/* Custom hook textarea */}
      {hasVersions && (
        <Card padding="md">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>{'✏️'}</span>
            <span>自定义开头</span>
            <span className="text-xs text-gray-400 font-normal">
              混合多个版本的优势，或输入你自己的开头
            </span>
          </h3>
          <textarea
            value={customHook}
            onChange={handleCustomChange}
            placeholder={'混合版本，或输入你自己的开头...\n例如："用 A 的数据冲击开场，但加上 B 的悬念感..."'}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-y"
            aria-label="自定义开头输入框"
          />
        </Card>
      )}

      {/* Current selection indicator */}
      {hasSelection && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <span className="text-blue-500 text-lg flex-shrink-0">{'✅'}</span>
          <div>
            <p className="text-sm font-medium text-blue-800 mb-0.5">
              当前选中的开头
            </p>
            <p className="text-sm font-semibold text-blue-900">
              {selected
                ? (function () {
                    var meta = HOOK_METHODS.find(function (m) { return m.method === selected; });
                    return meta ? meta.subtitle + ' — ' + meta.label : selected;
                  })()
                : '自定义混合版本'}
            </p>
          </div>
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <Button variant="ghost" size="md" onClick={goPrev}>
          上一步
        </Button>
        <Button
          variant="primary"
          size="md"
          disabled={!hasSelection}
          onClick={handleConfirm}
        >
          确认选中，进入 AI 检测
        </Button>
      </div>
    </div>
  );
};

export default Step8Hook;
