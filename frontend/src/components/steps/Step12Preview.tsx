import React, { useState, useCallback, useMemo, useRef, useEffect, type FC } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import type { ArticleStats } from '../../types/workflow';

/* ------------------------------------------------------------------ */
/*  Calculate article stats from raw text                                */
/* ------------------------------------------------------------------ */

function calcArticleStats(article: string): ArticleStats {
  var div = document.createElement('div');
  div.innerHTML = article;
  var plainText = (div.textContent || div.innerText || '').trim();

  if (!plainText) {
    return { wordCount: 0, paragraphCount: 0, estimatedReadTime: 0 };
  }

  var chineseChars = plainText.replace(/[\s\r\n]/g, '').length;
  var paragraphs = plainText
    .split(/\n\s*\n/)
    .filter(function (p) { return p.trim().length > 0; });
  var readTime = Math.max(1, Math.ceil(chineseChars / 300));

  return {
    wordCount: chineseChars,
    paragraphCount: paragraphs.length,
    estimatedReadTime: readTime,
  };
}

/* ------------------------------------------------------------------ */
/*  Toast notification component                                          */
/* ------------------------------------------------------------------ */

interface ToastProps {
  message: string;
  type: 'success' | 'info';
  visible: boolean;
}

var Toast: FC<ToastProps> = function ({ message, type, visible }) {
  var baseClass = 'fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 transform';
  var typeClass = type === 'success'
    ? 'bg-green-600 text-white'
    : 'bg-blue-600 text-white';
  var visibilityClass = visible
    ? 'opacity-100 translate-y-0'
    : 'opacity-0 -translate-y-2 pointer-events-none';

  return (
    <div className={baseClass + ' ' + typeClass + ' ' + visibilityClass}>
      <div className="flex items-center gap-2">
        <span>{type === 'success' ? '✅' : '📤'}</span>
        <span>{message}</span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Rendered article preview                                              */
/* ------------------------------------------------------------------ */

interface ArticlePreviewProps {
  article: string;
  selectedTitle: string;
  imageSlots: Array<{ index: number; topic: string; url?: string }>;
}

var ArticlePreview: FC<ArticlePreviewProps> = function ({ article, selectedTitle, imageSlots }) {
  /* Parse lines from article, handling HTML */
  var div = document.createElement('div');
  div.innerHTML = article;
  var plainText = (div.textContent || div.innerText || '').trim();

  if (!plainText) {
    return (
      <div className="text-center py-12 text-gray-400">
        <span className="text-3xl">{'📄'}</span>
        <p className="text-sm mt-2">{'无文章内容'}</p>
      </div>
    );
  }

  var paragraphs = plainText
    .split(/\n\s*\n/)
    .filter(function (p) { return p.trim().length > 0; });

  return (
    <div className="max-w-2xl mx-auto">
      {/* Title */}
      {selectedTitle && (
        <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">
          {selectedTitle}
        </h1>
      )}

      {/* Article body */}
      {paragraphs.map(function (para, i) {
        var text = para.trim();

        /* Section header with 【】 */
        if (text.startsWith('【') && text.includes('】')) {
          return (
            <div key={i} className="mt-6 mb-3">
              <h2 className="text-lg font-bold text-gray-800">
                {text}
              </h2>
              <div className="mt-2 w-12 h-1 bg-blue-500 rounded-full" />
            </div>
          );
        }

        /* Quote/subtitle (starts with special markers or is first paragraph after title) */
        if (i === 0 && (
          text.startsWith('「') ||
          text.startsWith('"') ||
          text.startsWith('"') ||
          text.startsWith('——')
        )) {
          return (
            <div key={i} className="border-l-4 border-blue-400 pl-4 py-1 my-4">
              <p className="text-gray-600 italic leading-relaxed">
                {text}
              </p>
            </div>
          );
        }

        /* Interactive question at end */
        if (i === paragraphs.length - 1 && (text.includes('？') || text.includes('?'))) {
          return (
            <div key={i} className="mt-6 pt-4 border-t-2 border-dashed border-gray-200">
              <p className="text-gray-700 leading-relaxed font-medium">
                <span className="text-blue-500 mr-1">{'💬'}</span>
                {text}
              </p>
            </div>
          );
        }

        /* Separator line based on markers */
        if (text === '---' || text === '***' || text === '...') {
          return (
            <div key={i} className="flex items-center justify-center my-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="px-3 text-gray-300 text-xs">{'· · ·'}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          );
        }

        /* Regular paragraph */
        return (
          <p key={i} className="text-gray-700 leading-relaxed mb-3 text-justify">
            {text}
          </p>
        );
      })}

      {/* Image placeholders inline */}
      {imageSlots.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-3">{'📷 文中配图'}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {imageSlots.filter(function (s) { return !!s.url; }).map(function (slot) {
              return (
                <div
                  key={slot.index}
                  className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                >
                  {slot.url ? (
                    <img
                      src={slot.url}
                      alt={slot.topic || ('插图 ' + (slot.index + 1))}
                      className="w-full aspect-video object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full aspect-video flex items-center justify-center bg-gray-100">
                      <span className="text-gray-300 text-2xl">{'🖼️'}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-500 px-2 py-1 truncate">
                    {slot.topic || ('插图 ' + (slot.index + 1))}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Skeleton loading                                                      */
/* ------------------------------------------------------------------ */

var SkeletonPreview: FC = function () {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-2/3" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-5/6" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-full" />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Empty state                                                          */
/* ------------------------------------------------------------------ */

var EmptyState: FC<{ onReset: () => void }> = function ({ onReset }) {
  return (
    <Card padding="lg">
      <div className="text-center py-8">
        <span className="text-5xl">{'🎉'}</span>
        <h3 className="text-lg font-semibold text-gray-800 mt-3 mb-1">
          {'恭喜完成！'}
        </h3>
        <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
          {'所有步骤已完成。文章已生成，可以复制全文、下载文档或重新开始创作。'}
        </p>
        <Button variant="secondary" size="md" onClick={onReset}>
          {'🔄 重新开始'}
        </Button>
      </div>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/*  Main component                                                       */
/* ------------------------------------------------------------------ */

var Step12Preview: FC = function () {
  var store = useWorkflowStore();
  var article = store.article || '';
  var selectedTitle = store.selectedTitle || '';
  var imageSlots = store.imageSlots;
  var exportFilename = store.exportFilename;
  var resetAll = store.resetAll;
  var goPrev = store.goPrev;
  var setCurrentStep = store.setCurrentStep;

  var [copyToast, setCopyToast] = useState(false);
  var [shareToast, setShareToast] = useState(false);

  /* Calculate stats */
  var stats = useMemo(
    function () { return calcArticleStats(article); },
    [article],
  );

  var hasContent = article.trim().length > 0;

  /* Auto-dismiss toast timers */
  var copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  var shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(function () {
    return function () {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    };
  }, []);

  /* Copy full article to clipboard */
  var handleCopy = useCallback(async function () {
    var div = document.createElement('div');
    div.innerHTML = article;
    var plainText = (div.textContent || div.innerText || '').trim();

    var fullText = selectedTitle
      ? selectedTitle + '\n\n' + plainText
      : plainText;

    try {
      await navigator.clipboard.writeText(fullText);
      setCopyToast(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(function () { setCopyToast(false); }, 2500);
    } catch (_err) {
      /* Fallback for older browsers */
      var textarea = document.createElement('textarea');
      textarea.value = fullText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopyToast(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(function () { setCopyToast(false); }, 2500);
    }
  }, [article, selectedTitle]);

  /* Download .docx */
  var handleDownload = useCallback(function () {
    if (exportFilename) {
      var link = document.createElement('a');
      link.href = '/api/export/download/' + encodeURIComponent(exportFilename);
      link.download = exportFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [exportFilename]);

  /* Reset and go to step 1 */
  var handleReset = useCallback(function () {
    resetAll();
    setCurrentStep(1);
  }, [resetAll, setCurrentStep]);

  /* Share placeholder */
  var handleShare = useCallback(function () {
    setShareToast(true);
    if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    shareTimerRef.current = setTimeout(function () { setShareToast(false); }, 2500);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Toast notifications */}
      <Toast message="已复制全文到剪贴板" type="success" visible={copyToast} />
      <Toast message="分享功能即将上线，敬请期待" type="info" visible={shareToast} />

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-xl font-bold text-gray-900">
            {'✅ 文章已完成！'}
          </h2>
          <span className="text-2xl">{'🎉'}</span>
        </div>
        <p className="text-sm text-gray-500">
          {'查看文章最终效果，复制全文或下载文档'}
        </p>
      </div>

      {/* Action buttons at top */}
      {hasContent && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="primary" size="sm" onClick={handleCopy}>
            {'📋 复制全文'}
          </Button>
          {exportFilename && (
            <Button variant="secondary" size="sm" onClick={handleDownload}>
              {'⬇ 下载 .docx'}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleShare}>
            {'📤 分享'}
          </Button>
          <div className="flex-1" />
          <Button variant="danger" size="sm" onClick={handleReset}>
            {'🔄 重新开始'}
          </Button>
        </div>
      )}

      {/* Article metadata */}
      {hasContent && (
        <Card padding="md">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Title */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">{'文章标题'}</p>
              <p className="text-base font-bold text-gray-900 truncate">
                {selectedTitle || '未命名'}
              </p>
            </div>

            {/* Divider */}
            <div className="w-px h-10 bg-gray-200 hidden sm:block" />

            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-800">
                  {stats.wordCount.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400">{'字数'}</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-800">
                  {stats.paragraphCount}
                </p>
                <p className="text-[10px] text-gray-400">{'段落'}</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-800">
                  {stats.estimatedReadTime}
                </p>
                <p className="text-[10px] text-gray-400">{'分钟阅读'}</p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2">
              {exportFilename ? (
                <Badge variant="success">{'已导出'}</Badge>
              ) : (
                <Badge variant="default">{'未导出'}</Badge>
              )}
              {imageSlots.length > 0 && (
                <Badge variant="info">
                  {imageSlots.filter(function (s) { return !!s.url; }).length + '/' + imageSlots.length + ' 图'}
                </Badge>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Rendered article preview */}
      {hasContent ? (
        <Card padding="lg">
          <div className="prose prose-sm max-w-none">
            <ArticlePreview
              article={article}
              selectedTitle={selectedTitle}
              imageSlots={imageSlots}
            />
          </div>
        </Card>
      ) : (
        <EmptyState onReset={handleReset} />
      )}

      {/* Bottom action buttons */}
      {hasContent && (
        <div className="flex items-center gap-2 flex-wrap justify-center pt-2 border-t border-gray-100">
          <Button variant="primary" size="md" onClick={handleCopy}>
            {'📋 复制全文'}
          </Button>
          {exportFilename && (
            <Button variant="secondary" size="md" onClick={handleDownload}>
              {'⬇ 下载 .docx'}
            </Button>
          )}
          <Button variant="ghost" size="md" onClick={handleShare}>
            {'📤 分享'}
          </Button>
        </div>
      )}

      {/* Bottom nav */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <Button variant="ghost" size="md" onClick={goPrev}>
          {'上一步'}
        </Button>
        <Button variant="secondary" size="md" onClick={handleReset}>
          {'🔄 重新开始'}
        </Button>
      </div>
    </div>
  );
};

export default Step12Preview;
