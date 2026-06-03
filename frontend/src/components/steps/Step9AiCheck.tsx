import React, { useState, useCallback, useRef, useMemo, useEffect, type FC } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { optimizeApi } from '../../lib/api';
import type {
  AiCheckResult,
  AiSignal,
  SignalLevel,
} from '../../types/workflow';

/* ------------------------------------------------------------------ */
/*  Signal level config                                                  */
/* ------------------------------------------------------------------ */

var SIGNAL_LEVEL_CONFIG: Record<SignalLevel, {
  label: string;
  badgeVariant: 'danger' | 'warning' | 'default';
  underlineClass: string;
  borderClass: string;
  bgClass: string;
  dotClass: string;
}> = {
  strong: {
    label: '强信号',
    badgeVariant: 'danger',
    underlineClass: 'underline decoration-red-500 decoration-2 underline-offset-4',
    borderClass: 'border-l-2 border-red-500',
    bgClass: 'bg-red-50',
    dotClass: 'bg-red-500',
  },
  medium: {
    label: '中信号',
    badgeVariant: 'warning',
    underlineClass: 'underline decoration-yellow-500 decoration-2 underline-offset-4',
    borderClass: 'border-l-2 border-yellow-500',
    bgClass: 'bg-yellow-50',
    dotClass: 'bg-yellow-500',
  },
  weak: {
    label: '弱信号',
    badgeVariant: 'default',
    underlineClass: 'underline decoration-gray-400 decoration-1 underline-offset-4',
    borderClass: 'border-l-2 border-gray-300',
    bgClass: 'bg-gray-50',
    dotClass: 'bg-gray-400',
  },
};

/* ------------------------------------------------------------------ */
/*  Parse article into highlightable paragraphs                          */
/* ------------------------------------------------------------------ */

interface HighlightSegment {
  text: string;
  isHighlight: boolean;
  level?: SignalLevel;
  signalId?: number;
}

interface ArticleParagraph {
  index: number;
  text: string;
  segments: HighlightSegment[];
}

function parseArticleToParagraphs(article: string, signals: AiSignal[]): ArticleParagraph[] {
  if (!article) return [];

  /* Strip HTML tags to get plain text */
  var div = document.createElement('div');
  div.innerHTML = article;
  var plainText = (div.textContent || div.innerText || '').trim();

  if (!plainText) return [];

  /* Split into paragraphs by double newline or long gaps */
  var rawParagraphs = plainText
    .split(/\n\s*\n/)
    .filter(function (p) { return p.trim().length > 0; })
    .map(function (p) { return p.trim(); });

  if (rawParagraphs.length === 0 && plainText.length > 0) {
    rawParagraphs = [plainText];
  }

  return rawParagraphs.map(function (paraText, idx) {
    var segments = findSignalMatches(paraText, signals);
    return {
      index: idx,
      text: paraText,
      segments: segments,
    };
  });
}

function findSignalMatches(text: string, signals: AiSignal[]): HighlightSegment[] {
  var result: HighlightSegment[] = [];
  var matched = false;

  /* Sort signals by level priority: strong > medium > weak */
  var sortedSignals = signals.slice().sort(function (a, b) {
    var order: Record<SignalLevel, number> = { strong: 0, medium: 1, weak: 2 };
    return order[a.level] - order[b.level];
  });

  for (var i = 0; i < sortedSignals.length; i++) {
    var signal = sortedSignals[i];
    var keywords = extractKeywords(signal);

    for (var k = 0; k < keywords.length; k++) {
      var keyword = keywords[k];
      if (keyword.length < 2) continue;

      var idx = text.toLowerCase().indexOf(keyword.toLowerCase());
      if (idx >= 0) {
        var before = text.slice(0, idx);
        var match = text.slice(idx, idx + keyword.length);
        var after = text.slice(idx + keyword.length);

        if (before) {
          var beforeResult = findSignalMatches(before, signals);
          result = result.concat(beforeResult);
        }

        result.push({
          text: match,
          isHighlight: true,
          level: signal.level,
          signalId: signal.id,
        });

        if (after) {
          var afterResult = findSignalMatches(after, signals);
          result = result.concat(afterResult);
        }

        matched = true;
        break;
      }
    }

    if (matched) break;
  }

  if (!matched) {
    result = [{ text: text, isHighlight: false }];
  }

  return result;
}

function extractKeywords(signal: AiSignal): string[] {
  var words: string[] = [];

  /* Extract potential search patterns from feature, description, and location */
  var sources = [signal.feature, signal.description, signal.location];
  for (var i = 0; i < sources.length; i++) {
    var source = sources[i];
    if (!source) continue;

    /* Match quoted strings */
    var quotes = source.match(/[""]([^""]+)[""]/g);
    if (quotes) {
      words = words.concat(quotes.map(function (q) { return q.replace(/[""]/g, ''); }));
    }

    /* Match Chinese quoted strings */
    var cnQuotes = source.match(/「([^」]+)」/g);
    if (cnQuotes) {
      words = words.concat(cnQuotes.map(function (q) { return q.replace(/[「」]/g, ''); }));
    }
  }

  if (words.length === 0) {
    /* Fallback: use signal feature as general area indicator */
    words.push(signal.feature);
  }

  return words;
}

/* ------------------------------------------------------------------ */
/*  Signal level badge                                                    */
/* ------------------------------------------------------------------ */

var SignalLevelBadge: FC<{ level: SignalLevel }> = function ({ level }) {
  var config = SIGNAL_LEVEL_CONFIG[level];
  return (
    <Badge variant={config.badgeVariant}>
      <span className={'inline-block w-1.5 h-1.5 rounded-full mr-1 ' + config.dotClass} aria-hidden="true" />
      {config.label}
    </Badge>
  );
};

/* ------------------------------------------------------------------ */
/*  Signal status icon                                                   */
/* ------------------------------------------------------------------ */

type SignalItemStatus = 'pending' | 'applied' | 'ignored';

var SignalStatusIcon: FC<{ status: SignalItemStatus }> = function ({ status }) {
  if (status === 'applied') {
    return (
      <span className="text-green-500 text-sm flex-shrink-0" role="img" aria-label="已应用" title="已应用">
        {'✅'}
      </span>
    );
  }
  if (status === 'ignored') {
    return (
      <span className="text-gray-400 text-sm flex-shrink-0 line-through" role="img" aria-label="已忽略" title="已忽略">
        {'🚫'}
      </span>
    );
  }
  return (
    <span className="text-gray-300 text-sm flex-shrink-0" role="img" aria-label="待处理" title="待处理">
      {'⬜'}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Skeleton loading                                                    */
/* ------------------------------------------------------------------ */

var SkeletonCheck: FC = function () {
  return (
    <div className="animate-pulse">
      <div className="flex gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-2/3" />
        </div>
        <div className="w-72 space-y-2">
          <div className="h-5 bg-gray-200 rounded w-full" />
          <div className="h-12 bg-gray-200 rounded w-full" />
          <div className="h-12 bg-gray-200 rounded w-full" />
          <div className="h-12 bg-gray-200 rounded w-full" />
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Article inline highlight display                                      */
/* ------------------------------------------------------------------ */

interface ArticleDisplayProps {
  article: string;
  signals: AiSignal[];
  activeSignalId: number | null;
  appliedFixes: number[];
  onParagraphClick: (signalId: number) => void;
}

var ArticleDisplay: FC<ArticleDisplayProps> = function ({ article, signals, activeSignalId, appliedFixes, onParagraphClick }) {
  var paragraphs = useMemo(
    function () { return parseArticleToParagraphs(article, signals); },
    [article, signals],
  );

  var paraRefs = useRef<Record<number, HTMLDivElement | null>>({});

  /* Scroll to paragraph when activeSignalId changes */
  useEffect(function () {
    if (activeSignalId != null) {
      var signal = signals.find(function (s) { return s.id === activeSignalId; });
      if (signal) {
        /* Find the paragraph that contains this signal */
        var targetIdx = -1;
        for (var i = 0; i < paragraphs.length; i++) {
          var para = paragraphs[i];
          for (var j = 0; j < para.segments.length; j++) {
            if (para.segments[j].signalId === activeSignalId) {
              targetIdx = para.index;
              break;
            }
          }
          if (targetIdx >= 0) break;
        }

        if (targetIdx >= 0 && paraRefs.current[targetIdx]) {
          paraRefs.current[targetIdx]!.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [activeSignalId, signals, paragraphs]);

  if (paragraphs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <span className="text-3xl">{'\u{1F4C4}'}</span>
        <p className="text-sm mt-2">无文章内容</p>
      </div>
    );
  }

  var getSignalHighlightClass = function (segment: HighlightSegment): string {
    if (!segment.isHighlight || !segment.level) return '';
    var config = SIGNAL_LEVEL_CONFIG[segment.level];
    if (!config) return '';

    var classes = config.borderClass + ' pl-2 ' + config.bgClass;
    if (segment.signalId != null && appliedFixes.includes(segment.signalId)) {
      classes = classes + ' opacity-50 line-through';
    }
    return classes;
  };

  var getSignalTextClass = function (segment: HighlightSegment): string {
    if (!segment.isHighlight || !segment.level) return 'text-gray-800';
    var config = SIGNAL_LEVEL_CONFIG[segment.level];
    if (!config) return 'text-gray-800';
    return config.underlineClass + ' cursor-pointer';
  };

  return (
    <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed space-y-4">
      {paragraphs.map(function (para) {
        return (
          <div
            key={para.index}
            ref={function (el) { paraRefs.current[para.index] = el; }}
            className="rounded-lg"
            id={'para-' + para.index}
          >
            <p className="mb-0">
              {para.segments.map(function (seg, si) {
                var segKey = para.index + '-' + si;
                if (seg.isHighlight && seg.level) {
                  var wrapperClass = getSignalHighlightClass(seg);
                  var textClass = getSignalTextClass(seg);
                  return (
                    <span
                      key={segKey}
                      className={'inline ' + textClass + ' ' + wrapperClass}
                      onClick={function () {
                        if (seg.signalId != null) {
                          onParagraphClick(seg.signalId);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={'信号 #' + (seg.signalId || '') + ': ' + seg.text.slice(0, 30)}
                      onKeyDown={function (e) {
                        if ((e.key === 'Enter' || e.key === ' ') && seg.signalId != null) {
                          e.preventDefault();
                          onParagraphClick(seg.signalId);
                        }
                      }}
                    >
                      {seg.text}
                    </span>
                  );
                }
                return <span key={segKey}>{seg.text}</span>;
              })}
            </p>
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Signal list panel                                                     */
/* ------------------------------------------------------------------ */

interface SignalListPanelProps {
  signals: AiSignal[];
  appliedFixes: number[];
  activeSignalId: number | null;
  onSignalClick: (id: number) => void;
  onApplyFix: (id: number) => void;
  onIgnoreFix: (id: number) => void;
}

var SignalListPanel: FC<SignalListPanelProps> = function ({
  signals,
  appliedFixes,
  activeSignalId,
  onSignalClick,
  onApplyFix,
  onIgnoreFix,
}) {
  var strongCount = signals.filter(function (s) { return s.level === 'strong'; }).length;
  var mediumCount = signals.filter(function (s) { return s.level === 'medium'; }).length;
  var weakCount = signals.filter(function (s) { return s.level === 'weak'; }).length;

  var getSignalStatus = function (signal: AiSignal): SignalItemStatus {
    if (appliedFixes.includes(signal.id)) return 'applied';
    /* Ignored: tracked separately — for now treat non-applied as ignored */
    return 'pending';
  };

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1.5">
          <span>{'\u{1F4CA}'}</span>
          <span>信号概览</span>
        </p>
        <div className="flex items-center gap-3 text-xs">
          {strongCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-600">强信号</span>
              <span className="font-semibold text-red-700">{strongCount}</span>
            </span>
          )}
          {mediumCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-gray-600">中信号</span>
              <span className="font-semibold text-yellow-700">{mediumCount}</span>
            </span>
          )}
          {weakCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-gray-600">弱信号</span>
              <span className="font-semibold text-gray-600">{weakCount}</span>
            </span>
          )}
          <span className="ml-auto text-gray-400">
            {'共 ' + signals.length + ' 条'}
          </span>
        </div>
      </div>

      {/* Signal list */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {signals.map(function (signal) {
          var config = SIGNAL_LEVEL_CONFIG[signal.level];
          var status = getSignalStatus(signal);
          var isActive = activeSignalId === signal.id;

          var cardClass = 'border rounded-lg p-3 transition-all duration-200 ';
          if (isActive) {
            cardClass = cardClass + 'ring-2 ring-blue-400 border-blue-400 bg-blue-50/50';
          } else if (status === 'applied') {
            cardClass = cardClass + 'border-green-200 bg-green-50/50';
          } else if (status === 'ignored') {
            cardClass = cardClass + 'border-gray-200 bg-gray-50/50 opacity-60';
          } else {
            cardClass = cardClass + 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm';
          }

          return (
            <div key={signal.id} className={cardClass}>
              {/* Header row */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <SignalStatusIcon status={status} />
                  <span className="text-xs font-mono text-gray-400">
                    {'#' + signal.id}
                  </span>
                  <span className="text-xs font-medium text-gray-800 truncate">
                    {signal.feature}
                  </span>
                </div>
                <SignalLevelBadge level={signal.level} />
              </div>

              {/* Description */}
              <p className="text-xs text-gray-600 mb-1 leading-relaxed">
                {signal.description}
              </p>

              {/* Location */}
              <p className="text-[10px] text-gray-400 mb-2">
                <span className="font-medium">位置：</span>
                <span
                  className="text-blue-500 cursor-pointer hover:underline"
                  onClick={function () { onSignalClick(signal.id); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSignalClick(signal.id);
                    }
                  }}
                >
                  {signal.location}
                </span>
              </p>

              {/* Suggestion */}
              {signal.suggestion && (
                <div className="bg-blue-50 border border-blue-100 rounded px-2.5 py-1.5 mb-2">
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <span className="font-medium">{'\u{1F4A1} '}</span>
                    {signal.suggestion}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              {status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
                    onClick={function () { onApplyFix(signal.id); }}
                    aria-label={'应用修改 #' + signal.id}
                  >
                    <span>{'✅'}</span>
                    <span>应用修改</span>
                  </button>
                  <button
                    type="button"
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                    onClick={function () { onIgnoreFix(signal.id); }}
                    aria-label={'忽略 #' + signal.id}
                  >
                    <span>{'🚫'}</span>
                    <span>忽略</span>
                  </button>
                </div>
              )}

              {/* Applied indicator */}
              {status === 'applied' && (
                <p className="text-xs text-green-600 italic">
                  {'✅ 已应用此修改'}
                </p>
              )}

              {/* Ignored indicator */}
              {status === 'ignored' && (
                <p className="text-xs text-gray-400 italic">
                  {'🚫 已忽略'}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>处理进度</span>
          <span>
            {appliedFixes.length + ' / ' + signals.length}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main component                                                       */
/* ------------------------------------------------------------------ */

var Step9AiCheck: FC = function () {
  var store = useWorkflowStore();
  var article = store.article;
  var aiCheckResults = store.aiCheckResults;
  var appliedFixes = store.appliedFixes;
  var setAiCheckResults = store.setAiCheckResults;
  var applyFix = store.applyFix;
  var setArticle = store.setArticle;
  var completeStep = store.completeStep;
  var goNext = store.goNext;
  var goPrev = store.goPrev;

  var [loading, setLoading] = useState(false);
  var [error, setError] = useState<string | null>(null);
  var [checked, setChecked] = useState(aiCheckResults != null && aiCheckResults.signals != null);
  var [activeSignalId, setActiveSignalId] = useState<number | null>(null);

  var localSignals = (aiCheckResults?.signals || []) as AiSignal[];
  var hasResults = localSignals.length > 0;

  /* Start AI check */
  var handleStartCheck = useCallback(async function () {
    if (!article || !article.trim()) {
      setError('请先在 Step 6 中生成或输入文章正文');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      var res = await optimizeApi.aiCheck({ article: article });
      if (res.success && res.data) {
        var data = res.data as unknown as AiCheckResult;
        if (data.signals && Array.isArray(data.signals)) {
          setAiCheckResults(data);
          setChecked(true);
        } else {
          setError('AI 检测失败，返回数据为空');
        }
      } else {
        setError(res.error || 'AI 检测失败，请稍后重试');
      }
    } catch (_err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [article, setAiCheckResults]);

  /* Click on signal from list */
  var handleSignalClick = useCallback(function (id: number) {
    setActiveSignalId(function (prev) {
      /* Toggle off if clicking the same signal */
      if (prev === id) {
        /* Still scroll to it */
        setTimeout(function () {
          setActiveSignalId(id);
        }, 50);
        return null;
      }
      return id;
    });
  }, []);

  /* Click on paragraph highlight */
  var handleParagraphClick = useCallback(function (signalId: number) {
    setActiveSignalId(signalId);
  }, []);

  /* Apply fix */
  var handleApplyFix = useCallback(function (id: number) {
    applyFix(id);
  }, [applyFix]);

  /* Ignore fix */
  var handleIgnoreFix = useCallback(function (_id: number) {
    /* Ignored: just mark it visually; store doesn't track ignores separately */
  }, []);

  /* Confirm and go to Step 10 */
  var handleConfirm = useCallback(function () {
    completeStep(9);
    goNext();
  }, [completeStep, goNext]);

  /* Render empty state */
  var renderEmpty = function () {
    return (
      <Card padding="lg">
        <div className="text-center py-8">
          <span className="text-5xl">{'\u{1F50D}'}</span>
          <h3 className="text-lg font-semibold text-gray-800 mt-3 mb-1">
            尚未检测
          </h3>
          <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
            22特征扫描，检测AI写作痕迹。包括强制信号、中等信号和弱信号。
            发现后逐条人工化润色，让文章读起来像是真人写的。
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

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Step 9：AI 检测
        </h2>
        <p className="text-sm text-gray-500">
          22特征扫描，逐条改写。检测AI写作痕迹，人工化润色
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
        {hasResults && (
          <>
            <span className="text-gray-400">|</span>
            <span className="text-xs text-green-600 font-medium">
              {'已检测到 ' + localSignals.length + ' 条信号'}
            </span>
          </>
        )}
      </div>

      {/* Generate button area */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {checked && hasResults && (
            <Badge variant="success">
              {'已检测 ' + localSignals.length + ' 条信号'}
            </Badge>
          )}
          {checked && hasResults && appliedFixes.length > 0 && (
            <Badge variant="info">
              {'已处理 ' + appliedFixes.length + ' 条'}
            </Badge>
          )}
          {!checked && !loading && (
            <span className="text-sm text-gray-400">
              点击右侧按钮开始 AI 检测
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {checked && hasResults && !loading && (
            <Button
              variant="ghost"
              size="md"
              onClick={handleStartCheck}
            >
              重新检测
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            loading={loading}
            disabled={!article || !article.trim()}
            onClick={handleStartCheck}
          >
            {'\u{1F50D} 开始检测'}
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
      {loading && <SkeletonCheck />}

      {/* Empty state */}
      {!loading && !hasResults && !error && renderEmpty()}

      {/* Results: two-column layout */}
      {!loading && hasResults && (
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left: Article display */}
          <div className="flex-1 min-w-0">
            <div className="sticky top-4">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span>{'\u{1F4C4}'}</span>
                <span>文章预览</span>
                <span className="text-xs text-gray-400 font-normal">
                  点击高亮文字查看对应信号
                </span>
              </h3>

              <Card padding="md" className="max-h-[65vh] overflow-y-auto">
                <ArticleDisplay
                  article={article || ''}
                  signals={localSignals}
                  activeSignalId={activeSignalId}
                  appliedFixes={appliedFixes}
                  onParagraphClick={handleParagraphClick}
                />
              </Card>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 px-1 text-xs text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-3 h-0.5 bg-red-500 rounded" />
                  强信号
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-3 h-0.5 bg-yellow-500 rounded" />
                  中信号
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block w-3 h-0.5 bg-gray-400 rounded" />
                  弱信号
                </span>
              </div>
            </div>
          </div>

          {/* Right: Signal list panel */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <SignalListPanel
              signals={localSignals}
              appliedFixes={appliedFixes}
              activeSignalId={activeSignalId}
              onSignalClick={handleSignalClick}
              onApplyFix={handleApplyFix}
              onIgnoreFix={handleIgnoreFix}
            />
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
          disabled={!hasResults}
          onClick={handleConfirm}
        >
          确认，进入配图
        </Button>
      </div>
    </div>
  );
};

export default Step9AiCheck;
