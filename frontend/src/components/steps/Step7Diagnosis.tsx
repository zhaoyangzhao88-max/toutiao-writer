import React, { useState, useCallback, type FC } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { StatusIcon } from '../ui/StatusIcon';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { optimizeApi } from '../../lib/api';
import type {
  DiagnosisReport,
  DimensionResult,
  UserChoice,
  DiagnosisVerdict,
} from '../../types/workflow';

/* ------------------------------------------------------------------ */
/*  Dimension metadata                                                   */
/* ------------------------------------------------------------------ */

interface DimensionMeta {
  key: number;
  name: string;
  emoji: string;
  description: string;
}

var DIMENSIONS: DimensionMeta[] = [
  { key: 1, name: '文字洁癖', emoji: '\u{1F9F9}', description: '口语感自然吗？有排比堆叠、AI翻译腔吗？' },
  { key: 2, name: '标题', emoji: '\u{1F3F7}️', description: '字数23-28？含关键词/冲突/悬念？' },
  { key: 3, name: '表达效率', emoji: '⚡', description: '前100字进主题？有注水段落？信息密度' },
  { key: 4, name: '认知落差', emoji: '\u{1F9E0}', description: '读者有新知/独特角度/独家数据？' },
  { key: 5, name: 'AI 辅助度', emoji: '\u{1F916}', description: '有个人判断/毛边/不骑墙吗？' },
];

var VERDICT_CONFIG: Record<DiagnosisVerdict, { icon: string; label: string; badgeVariant: 'success' | 'warning' | 'danger' }> = {
  pass: { icon: '✅', label: '通过', badgeVariant: 'success' },
  warn: { icon: '⚠️', label: '关注', badgeVariant: 'warning' },
  fail: { icon: '❌', label: '需修改', badgeVariant: 'danger' },
};

/* ------------------------------------------------------------------ */
/*  Skeleton loading cards                                              */
/* ------------------------------------------------------------------ */

var SkeletonCard: FC = function () {
  return (
    <div className="border border-gray-200 rounded-xl p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-5 w-5 bg-gray-200 rounded-full" />
        <div className="h-4 bg-gray-200 rounded w-28" />
        <div className="h-5 bg-gray-200 rounded-full w-14" />
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>
      <div className="h-3 bg-gray-200 rounded w-3/4" />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Verdict badge helper                                                 */
/* ------------------------------------------------------------------ */

var VerdictBadge: FC<{ verdict: DiagnosisVerdict }> = function ({ verdict }) {
  var config = VERDICT_CONFIG[verdict];
  return (
    <Badge variant={config.badgeVariant}>
      {config.icon + ' ' + config.label}
    </Badge>
  );
};

/* ------------------------------------------------------------------ */
/*  Dimension card                                                       */
/* ------------------------------------------------------------------ */

interface DimensionCardProps {
  dim: DimensionResult;
  meta: DimensionMeta;
}

var DimensionCard: FC<DimensionCardProps> = function ({ dim, meta }) {
  return (
    <Card padding="md" className="hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label={meta.name}>
            {meta.emoji}
          </span>
          <h3 className="font-semibold text-gray-800 text-sm">
            {meta.name}
          </h3>
        </div>
        <VerdictBadge verdict={dim.verdict} />
      </div>

      <p className="text-xs text-gray-400 mb-2">
        {meta.description}
      </p>

      {/* Issues list */}
      {dim.issues.length > 0 && (
        <ul className="space-y-1 mb-3">
          {dim.issues.map(function (issue, i) {
            return (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed"
              >
                <span className="text-red-400 flex-shrink-0 mt-0.5">{'●'}</span>
                <span>{issue}</span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Suggestion */}
      {dim.suggestion && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          <p className="text-xs text-blue-800 leading-relaxed">
            <span className="font-medium">{'\u{1F4A1} 建议：'}</span>
            {dim.suggestion}
          </p>
        </div>
      )}
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/*  Main component                                                       */
/* ------------------------------------------------------------------ */

var Step7Diagnosis: FC = function () {
  var store = useWorkflowStore();
  var article = store.article;
  var selectedTitle = store.selectedTitle;
  var diagnosisReport = store.diagnosisReport;
  var userChoice = store.userChoice;
  var setDiagnosisReport = store.setDiagnosisReport;
  var setUserChoice = store.setUserChoice;
  var setArticle = store.setArticle;
  var completeStep = store.completeStep;
  var skipStep = store.skipStep;
  var goNext = store.goNext;
  var goPrev = store.goPrev;

  var [loading, setLoading] = useState(false);
  var [error, setError] = useState<string | null>(null);
  var [diagnosed, setDiagnosed] = useState(diagnosisReport != null);
  var [loopCount, setLoopCount] = useState(0);
  var [applyingFix, setApplyingFix] = useState(false);

  var localReport = diagnosisReport;
  var hasReport = localReport != null && localReport.dimensions != null && localReport.dimensions.length > 0;

  /* Start diagnosis */
  var handleStartDiagnosis = useCallback(async function () {
    if (!article || !article.trim()) {
      setError('请先在 Step 6 中生成或输入文章正文');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      var res = await optimizeApi.diagnose({ article: article, title: selectedTitle || '' });
      if (res.success && res.data) {
        var data = res.data as unknown as DiagnosisReport;
        setDiagnosisReport(data);
        setDiagnosed(true);
        // loopCount only incremented by handleFixAll, not by diagnosis itself
      } else {
        setError(res.error || '诊断失败，请稍后重试');
      }
    } catch (_err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [article, selectedTitle, setDiagnosisReport]);

  /* Re-run diagnosis after fix-all */
  var handleReDiagnose = useCallback(async function () {
    await handleStartDiagnosis();
  }, [handleStartDiagnosis]);

  /* Fix one: apply firstAction, go to Step 8 */
  var handleFixOne = useCallback(function () {
    if (!localReport || !localReport.firstAction) return;
    setUserChoice('fix-one');
    setApplyingFix(true);

    /* Simulate article update — in production the backend would return updated text */
    /* For now we mark the choice and proceed */
    setTimeout(function () {
      setApplyingFix(false);
      completeStep(7);
      goNext();
    }, 300);
  }, [localReport, setUserChoice, completeStep, goNext]);

  /* Fix all: call AI to fix article, update it, re-run diagnosis. */
  var handleFixAll = useCallback(async function () {
    if (!localReport || !localReport.dimensions) return;
    setUserChoice('fix-all');
    setApplyingFix(true);

    try {
      var res = await optimizeApi.fix({
        article: article || '',
        title: selectedTitle || '',
        diagnosis: localReport,
        cycle: loopCount + 1,
      });
      if (res.success && res.data) {
        var data = res.data as unknown as { article: string; cycle: number };
        setArticle(data.article);
        setLoopCount(data.cycle);
      }
    } catch (_err) {
      /* If fix fails, still try re-diagnosis with current article */
    }
    setApplyingFix(false);

    /* Re-run diagnosis with fixed article */
    await handleReDiagnose();
  }, [localReport, loopCount, article, selectedTitle, setUserChoice, setArticle, handleReDiagnose]);

  /* Skip diagnosis */
  var handleSkip = useCallback(function () {
    setUserChoice('skip');
    skipStep(7);
    goNext();
  }, [setUserChoice, skipStep, goNext]);

  /* Render skeleton loading */
  var renderLoading = function () {
    return (
      <div className="space-y-4">
        <div className="border border-amber-200 rounded-xl p-5 animate-pulse bg-amber-50/50">
          <div className="h-4 bg-amber-200 rounded w-32 mb-3" />
          <div className="h-5 bg-amber-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-amber-200 rounded w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3, 4].map(function (i) {
            return <SkeletonCard key={i} />;
          })}
        </div>
      </div>
    );
  };

  /* Render empty state */
  var renderEmpty = function () {
    return (
      <Card padding="lg">
        <div className="text-center py-8">
          <span className="text-5xl">{'\u{1F50D}'}</span>
          <h3 className="text-lg font-semibold text-gray-800 mt-3 mb-1">
            尚未诊断
          </h3>
          <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
            从五个维度全面诊断文章质量：文字洁癖、标题、表达效率、认知落差、AI辅助度。
            诊断完成后你会看到详细的修改建议。
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

  /* Render first action card */
  var renderFirstAction = function () {
    if (!localReport || !localReport.firstAction) return null;
    var fa = localReport.firstAction;
    return (
      <div className="border-2 border-amber-400 rounded-xl p-5 bg-amber-50/60">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{'\u{1F3AF}'}</span>
          <h3 className="font-bold text-amber-900 text-base">
            第一步做什么
          </h3>
          <Badge variant="warning">最重要</Badge>
        </div>
        <p className="text-sm font-semibold text-amber-800 mb-1">
          {fa.action}
        </p>
        <p className="text-xs text-amber-700 leading-relaxed">
          {fa.reason}
        </p>
      </div>
    );
  };

  /* Render choice menu */
  var renderChoiceMenu = function () {
    if (applyingFix) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2" />
          <p className="text-sm text-gray-600">正在应用修改...</p>
        </div>
      );
    }

    return (
      <div className="border border-gray-200 rounded-xl p-5 bg-white">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>{'\u{1F449}'}</span>
          <span>下一步？</span>
          {loopCount > 1 && (
            <Badge variant="info">
              {'诊断轮次 #' + loopCount}
            </Badge>
          )}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Fix one */}
          <button
            type="button"
            className="flex flex-col items-start gap-2 p-4 border-2 border-amber-300 rounded-xl bg-amber-50 hover:bg-amber-100 hover:border-amber-400 transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            onClick={handleFixOne}
            aria-label="按第一步做什么修改"
          >
            <span className="text-2xl">{'✏️'}</span>
            <div>
              <p className="text-sm font-semibold text-amber-900 mb-0.5">
                按 "第一步做什么" 修改
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                只执行最重要的那项修改，进入开头优化
              </p>
            </div>
          </button>

          {/* Fix all */}
          <button
            type="button"
            className="flex flex-col items-start gap-2 p-4 border-2 border-blue-300 rounded-xl bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            onClick={handleFixAll}
            aria-label="全部按诊断修改并重新诊断"
          >
            <span className="text-2xl">{'\u{1F504}'}</span>
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-0.5">
                全部按诊断修改
              </p>
              <p className="text-xs text-blue-700 leading-relaxed">
                执行所有维度建议，AI 修改后重新诊断{' '}
                {loopCount > 0 && <span>(第 {loopCount} 轮)</span>}
              </p>
            </div>
          </button>

          {/* Skip */}
          <button
            type="button"
            className="flex flex-col items-start gap-2 p-4 border-2 border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            onClick={handleSkip}
            aria-label="跳过诊断直接进入开头优化"
          >
            <span className="text-2xl">{'⏭️'}</span>
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-0.5">
                跳过诊断
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                不修改，直接进入 Step 8 开头优化
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Step 7：五维诊断
        </h2>
        <p className="text-sm text-gray-500">
          暂停一下，从五个维度诊断文章质量，发现隐藏问题
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
        {selectedTitle && (
          <>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500 truncate max-w-xs">
              {selectedTitle.length > 30
                ? selectedTitle.slice(0, 30) + '...'
                : selectedTitle}
            </span>
          </>
        )}
      </div>

      {/* Generate button area */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {diagnosed && hasReport && (
            <Badge variant="success">
              {'已诊断 ' + localReport!.dimensions.length + ' 个维度'}
            </Badge>
          )}
          {!diagnosed && !loading && (
            <span className="text-sm text-gray-400">
              点击右侧按钮开始诊断
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {diagnosed && hasReport && !loading && (
            <Button
              variant="ghost"
              size="md"
              onClick={handleStartDiagnosis}
            >
              重新诊断
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            loading={loading}
            disabled={!article || !article.trim()}
            onClick={handleStartDiagnosis}
          >
            {'\u{1F50D} 开始诊断'}
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
      {!loading && !hasReport && !error && renderEmpty()}

      {/* Diagnosis results */}
      {!loading && hasReport && (
        <div className="space-y-4">
          {/* First action card */}
          {renderFirstAction()}

          {/* Dimension cards grid */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>{'\u{1F4CA}'}</span>
              <span>五维诊断结果</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {localReport!.dimensions.map(function (dim, i) {
                var meta = DIMENSIONS[i] || {
                  key: i + 1,
                  name: dim.name || ('维度 ' + (i + 1)),
                  emoji: '\u{1F4CB}',
                  description: '',
                };
                return (
                  <DimensionCard
                    key={i}
                    dim={dim}
                    meta={meta}
                  />
                );
              })}
            </div>
          </div>

          {/* Summary stats */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-gray-700">
                诊断汇总：
              </span>
              {(['pass', 'warn', 'fail'] as DiagnosisVerdict[]).map(function (v) {
                var count = localReport!.dimensions.filter(function (d) { return d.verdict === v; }).length;
                if (count === 0) return null;
                var config = VERDICT_CONFIG[v];
                return (
                  <span key={v} className="inline-flex items-center gap-1 text-xs">
                    <span>{config.icon}</span>
                    <span className="text-gray-600">{config.label}</span>
                    <span className="font-semibold text-gray-800">{count}</span>
                  </span>
                );
              })}
              <span className="text-xs text-gray-400 ml-auto">
                {'诊断轮次: ' + loopCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Choice menu */}
      {!loading && hasReport && renderChoiceMenu()}

      {/* Bottom navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <Button variant="ghost" size="md" onClick={goPrev}>
          上一步
        </Button>
      </div>
    </div>
  );
};

export default Step7Diagnosis;
