import React, { useState, useCallback, useMemo, type FC } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { StatusIcon } from '../ui/StatusIcon';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { exportApi } from '../../lib/api';
import type { ArticleStats } from '../../types/workflow';

/* ------------------------------------------------------------------ */
/*  Calculate article stats from raw text                                */
/* ------------------------------------------------------------------ */

function calcArticleStats(article: string): ArticleStats {
  /* Strip HTML tags */
  var div = document.createElement('div');
  div.innerHTML = article;
  var plainText = (div.textContent || div.innerText || '').trim();

  if (!plainText) {
    return { wordCount: 0, paragraphCount: 0, estimatedReadTime: 0 };
  }

  /* Chinese character count (exclude spaces, punctuation approximate) */
  var chineseChars = plainText.replace(/[\s\r\n]/g, '').length;

  /* Paragraph count by double newline */
  var paragraphs = plainText
    .split(/\n\s*\n/)
    .filter(function (p) { return p.trim().length > 0; });

  /* Estimated read time: ~300 chars/min for Chinese */
  var readTime = Math.max(1, Math.ceil(chineseChars / 300));

  return {
    wordCount: chineseChars,
    paragraphCount: paragraphs.length,
    estimatedReadTime: readTime,
  };
}

/* ------------------------------------------------------------------ */
/*  Section tree mini-map                                                 */
/* ------------------------------------------------------------------ */

interface SectionNode {
  label: string;
  type: 'title' | 'quote' | 'heading' | 'body' | 'ending';
}

function parseSections(article: string): SectionNode[] {
  var div = document.createElement('div');
  div.innerHTML = article;
  var plainText = (div.textContent || div.innerText || '').trim();
  if (!plainText) return [];

  var lines = plainText.split('\n').filter(function (l) { return l.trim().length > 0; });
  var nodes: SectionNode[] = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (line.startsWith('【') && line.includes('】')) {
      nodes.push({ label: line.slice(0, 20), type: 'heading' });
    } else if (line.startsWith('「') || line.startsWith('"') || line.startsWith('"')) {
      nodes.push({ label: line.slice(0, 24) + '…', type: 'quote' });
    } else if (line.includes('？') || line.includes('?') && i === lines.length - 1) {
      nodes.push({ label: line.slice(0, 20) + '…', type: 'ending' });
    }
  }

  /* If no headings found, create simulated structure */
  if (nodes.filter(function (n) { return n.type === 'heading'; }).length === 0) {
    /* Estimate based on paragraph count */
    var paragraphs = plainText
      .split(/\n\s*\n/)
      .filter(function (p) { return p.trim().length > 0; });

    if (paragraphs.length >= 5) {
      var step = Math.floor(paragraphs.length / 4);
      for (var j = 1; j <= Math.min(3, paragraphs.length - 1); j++) {
        nodes.push({ label: '【小标题' + j + '】', type: 'heading' });
      }
      nodes.push({ label: '??? 互动话题', type: 'ending' });
    }
  }

  return nodes;
}

/* ------------------------------------------------------------------ */
/*  Skeleton loading                                                      */
/* ------------------------------------------------------------------ */

var SkeletonExport: FC = function () {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-28 bg-gray-200 rounded-xl" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-2.5 bg-gray-200 rounded-full w-full" />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Section tree mini-map component                                       */
/* ------------------------------------------------------------------ */

var SectionTree: FC<{ sections: SectionNode[]; title: string }> = function ({ sections, title }) {
  if (sections.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        {'暂无结构数据'}
      </div>
    );
  }

  var iconMap: Record<SectionNode['type'], string> = {
    title: '📌',
    quote: '💬',
    heading: '📎',
    body: '📝',
    ending: '❓',
  };

  var colorMap: Record<SectionNode['type'], string> = {
    title: 'bg-blue-100 text-blue-700 border-blue-200',
    quote: 'bg-amber-100 text-amber-700 border-amber-200',
    heading: 'bg-purple-100 text-purple-700 border-purple-200',
    body: 'bg-gray-100 text-gray-600 border-gray-200',
    ending: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <div className="space-y-1.5">
      {/* Title */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
        <span>{iconMap.title}</span>
        <span className="text-sm font-medium text-blue-800 truncate">
          {title || '未命名'}
        </span>
      </div>

      {/* Connector line */}
      <div className="flex justify-center">
        <div className="w-0.5 h-3 bg-gray-300" />
      </div>

      {/* Sections */}
      {sections.map(function (node, i) {
        var isFirst = i === 0;
        var isLast = i === sections.length - 1;
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <div className="flex justify-center">
                <div className="w-0.5 h-2 bg-gray-200" />
              </div>
            )}
            <div
              className={
                'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ' +
                colorMap[node.type]
              }
            >
              <span className="text-xs">{iconMap[node.type]}</span>
              <span className="truncate">{node.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Empty state                                                          */
/* ------------------------------------------------------------------ */

var EmptyState: FC = function () {
  return (
    <Card padding="lg">
      <div className="text-center py-8">
        <span className="text-5xl">{'📄'}</span>
        <h3 className="text-lg font-semibold text-gray-800 mt-3 mb-1">
          {'准备生成文档'}
        </h3>
        <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
          {'将文章标题、正文和配图整合为一份结构清晰的 .docx 文档，可直接发布平台。'}
        </p>
        <p className="text-xs text-amber-600 bg-amber-50 inline-block px-3 py-1.5 rounded-lg">
          {'⚠️ 提示：请确认前面步骤已完成，文章内容已生成'}
        </p>
      </div>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/*  Main component                                                       */
/* ------------------------------------------------------------------ */

var Step11Export: FC = function () {
  var store = useWorkflowStore();
  var article = store.article || '';
  var selectedTitle = store.selectedTitle || '';
  var imageSlots = store.imageSlots;
  var exportStatus = store.exportStatus;
  var exportFilename = store.exportFilename;
  var setExportStatus = store.setExportStatus;
  var setExportFilename = store.setExportFilename;
  var setArticleStats = store.setArticleStats;
  var completeStep = store.completeStep;
  var goNext = store.goNext;
  var goPrev = store.goPrev;

  var [error, setError] = useState<string | null>(null);
  var [downloadReady, setDownloadReady] = useState(false);

  /* Calculate stats */
  var stats = useMemo(
    function () { return calcArticleStats(article); },
    [article],
  );

  /* Parse section structure */
  var sections = useMemo(
    function () { return parseSections(article); },
    [article],
  );

  var hasContent = article.trim().length > 0;

  /* Generate .docx */
  var handleGenerate = useCallback(async function () {
    if (!article || !article.trim()) {
      setError('请先在 Step 6 中生成或输入文章正文');
      return;
    }

    setExportStatus('generating');
    setError(null);
    setDownloadReady(false);

    try {
      var res = await exportApi.docx({
        title: selectedTitle || '未命名文章',
        article: article,
        images: imageSlots.filter(function (s): s is typeof s & { url: string } { return !!s.url; }).map(function (s) { return s.url; }),
      });

      if (res.success && res.data) {
        var data = res.data as unknown as { filename?: string; downloadUrl?: string };
        setExportFilename(data.filename || 'article.docx');
        setExportStatus('done');
        setArticleStats(stats);
        setDownloadReady(true);
      } else {
        setExportStatus('error');
        setError(res.error || '文档生成失败，请稍后重试');
      }
    } catch (_err) {
      setExportStatus('error');
      setError('网络错误，请稍后重试');
    }
  }, [article, selectedTitle, imageSlots, stats, setExportStatus, setExportFilename, setArticleStats]);

  /* Handle download */
  var handleDownload = useCallback(function () {
    if (exportFilename) {
      /* Trigger download via the /api/export/download endpoint if it exists,
         or use a direct approach */
      var link = document.createElement('a');
      link.href = '/api/export/download/' + encodeURIComponent(exportFilename);
      link.download = exportFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [exportFilename]);

  /* Handle confirm and go to next */
  var handleConfirm = useCallback(function () {
    completeStep(11);
    goNext();
  }, [completeStep, goNext]);

  /* Handle retry */
  var handleRetry = useCallback(function () {
    setExportStatus('idle');
    setError(null);
    setDownloadReady(false);
    setTimeout(function () { handleGenerate(); }, 300);
  }, [handleGenerate, setExportStatus]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Step 11：生成文档
        </h2>
        <p className="text-sm text-gray-500">
          将文章导出为标准格式 .docx 文档，含排版和封面
        </p>
      </div>

      {/* Article info banner */}
      {hasContent && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3 text-sm flex-wrap">
          <span className="text-gray-500 flex-shrink-0">{'📄'}</span>
          <span className="text-gray-600">
            {'标题: ' + (selectedTitle || '未命名')}
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">
            {'正文字数: ' + stats.wordCount + ' 字'}
          </span>
          {imageSlots.length > 0 && (
            <>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">
                {'配图: ' + imageSlots.filter(function (s) { return !!s.url; }).length + '/' + imageSlots.length + ' 张'}
              </span>
            </>
          )}
        </div>
      )}

      {/* Document structure preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Structure tree */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>{'🗂️'}</span>
            <span>文档结构预览</span>
          </h3>
          <SectionTree sections={sections} title={selectedTitle || '未命名文章'} />
        </Card>

        {/* Article stats */}
        <Card padding="md">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>{'📊'}</span>
            <span>文章统计</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">字数</span>
              <span className="text-sm font-semibold text-gray-900">
                {stats.wordCount.toLocaleString()} 字
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">段落数</span>
              <span className="text-sm font-semibold text-gray-900">
                {stats.paragraphCount} 段
              </span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">预计阅读时间</span>
              <span className="text-sm font-semibold text-gray-900">
                {'约 ' + stats.estimatedReadTime + ' 分钟'}
              </span>
            </div>

            {/* Image status */}
            {imageSlots.length > 0 && (
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">已选配图</span>
                <span className="text-sm font-semibold text-gray-900">
                  {imageSlots.filter(function (s) { return !!s.url; }).length + ' / ' + imageSlots.length}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Progress bar during generation */}
      {exportStatus === 'generating' && (
        <Card padding="md">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <svg
                className="h-5 w-5 animate-spin text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {'正在生成 .docx 文档...'}
                </p>
                <p className="text-xs text-gray-400">
                  {'正在整合标题、正文和配图数据'}
                </p>
              </div>
            </div>
            <ProgressBar value={60} color="blue" showLabel />
          </div>
        </Card>
      )}

      {/* Success state */}
      {exportStatus === 'done' && downloadReady && (
        <Card padding="md" className="border-green-200 bg-green-50/50">
          <div className="flex flex-col items-center text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-2xl">{'✅'}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-1">
                {'文档生成成功！'}
              </h3>
              <p className="text-sm text-green-600">
                {exportFilename || 'article.docx'}
              </p>
            </div>
            <Button variant="primary" size="lg" onClick={handleDownload}>
              {'⬇ 下载 .docx'}
            </Button>
          </div>
        </Card>
      )}

      {/* Error state */}
      {exportStatus === 'error' && error && (
        <Card padding="md" className="border-red-200 bg-red-50/50">
          <div className="flex flex-col items-center text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-2xl">{'❌'}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-1">
                {'生成失败'}
              </h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <Button variant="danger" size="md" onClick={handleRetry}>
              {'🔄 重试'}
            </Button>
          </div>
        </Card>
      )}

      {/* Loading state */}
      {!hasContent && <EmptyState />}

      {/* Generate button area (when not generating/done) */}
      {hasContent && exportStatus !== 'generating' && exportStatus !== 'done' && (
        <div className="flex justify-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerate}
            disabled={!hasContent}
          >
            {'📄 生成 .docx 文档'}
          </Button>
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <Button variant="ghost" size="md" onClick={goPrev}>
          {'上一步'}
        </Button>
        <Button
          variant="primary"
          size="md"
          disabled={exportStatus !== 'done'}
          onClick={handleConfirm}
        >
          {'下载完成，查看预览'}
        </Button>
      </div>
    </div>
  );
};

export default Step11Export;
