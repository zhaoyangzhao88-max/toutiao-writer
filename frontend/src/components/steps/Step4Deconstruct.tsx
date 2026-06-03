import React, { useState, useMemo, useCallback, type FC } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { StatusIcon } from '../ui/StatusIcon';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { writingApi } from '../../lib/api';
import { GENRE_OPTIONS, FUZZY_WORD_MAP } from '../../lib/constants';
import type { DeconstructResult, FuzzyTerm, GenreType } from '../../types/workflow';

interface DetectedWord {
  term: string;
  replacement: string;
  context: string;
  index: number;
}

const AMBER_CARD =
  'bg-amber-50 border border-amber-200 rounded-lg p-4';
const GREEN_CARD =
  'bg-green-50 border border-green-200 rounded-lg p-4';
const RED_TEXT = 'text-red-600 font-semibold';
const TERM_BADGE =
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800';

function extractContext(text: string, term: string, range: number): string {
  const idx = text.indexOf(term);
  if (idx === -1) return '';
  const start = Math.max(0, idx - range);
  const end = Math.min(text.length, idx + term.length + range);
  var snippet = text.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  return snippet;
}

function findFuzzyWords(text: string): DetectedWord[] {
  if (!text || text.length === 0) return [];
  var results: DetectedWord[] = [];
  var seenTerms = new Set<string>();
  var lowerText = text.toLowerCase();
  var indexCounter = 0;

  Object.entries(FUZZY_WORD_MAP).forEach(function (entry) {
    var term = entry[0];
    var replacement = entry[1];
    if (seenTerms.has(term)) return;
    var lowerTerm = term.toLowerCase();
    if (lowerText.indexOf(lowerTerm) !== -1) {
      seenTerms.add(term);
      var context = extractContext(text, term, 25);
      results.push({
        term: term,
        replacement: replacement,
        context: context || text.slice(0, 60) + '...',
        index: indexCounter,
      });
      indexCounter = indexCounter + 1;
    }
  });

  return results;
}

const Step4Deconstruct: FC = function () {
  var store = useWorkflowStore();
  var fetchedContent = store.fetchedContent;
  var rawInput = store.rawInput;
  var deconstructResult = store.deconstructResult;
  var materialCard = store.materialCard;
  var setDeconstructResult = store.setDeconstructResult;
  var completeStep = store.completeStep;
  var skipStep = store.skipStep;
  var goNext = store.goNext;
  var goPrev = store.goPrev;

  var rawMaterial = fetchedContent?.content || rawInput || '';

  var initialGenre: GenreType =
    deconstructResult?.genre || 'business';

  var initFuzzyTerms: FuzzyTerm[] = deconstructResult?.fuzzyTerms || [];

  var [genre, setGenre] = useState<GenreType>(initialGenre);
  var [detectedWords, setDetectedWords] = useState<DetectedWord[]>(function () {
    return findFuzzyWords(rawMaterial);
  });
  var [fuzzyTerms, setFuzzyTerms] = useState<FuzzyTerm[]>(initFuzzyTerms);
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState<string | null>(null);
  var [aiScanned, setAiScanned] = useState(false);
  var [confirmedTerms, setConfirmedTerms] = useState<Set<number>>(new Set());
  var [skippedTerms, setSkippedTerms] = useState<Set<number>>(new Set());
  var [noteMessage, setNoteMessage] = useState<string | null>(null);
  var [autoSkipped, setAutoSkipped] = useState(false);

  var pendingWords = detectedWords.filter(function (w) {
    return !confirmedTerms.has(w.index) && !skippedTerms.has(w.index);
  });

  var allResolved = detectedWords.length === 0 ||
    detectedWords.every(function (w) {
      return confirmedTerms.has(w.index) || skippedTerms.has(w.index);
    });

  var handleGenreChange = function (e: React.ChangeEvent<HTMLSelectElement>) {
    setGenre(e.target.value as GenreType);
  };

  var handleConfirmTerm = function (index: number) {
    setConfirmedTerms(function (prev) {
      var next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  var handleSkipTerm = function (index: number) {
    setSkippedTerms(function (prev) {
      var next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  var handleAiScan = useCallback(async function () {
    if (!rawMaterial.trim()) return;
    setLoading(true);
    setError(null);
    setNoteMessage(null);
    setAutoSkipped(false);
    try {
      var res = await writingApi.deconstruct({ material_card: materialCard || {} });
      if (res.success && res.data) {
        var data = res.data as unknown as DeconstructResult;
        if (data.note === '此篇模糊词少，跳过概念拆解') {
          setNoteMessage(data.note);
          setAutoSkipped(true);
          setDeconstructResult(data);
          skipStep(4);
          setTimeout(function () {
            goNext();
          }, 1500);
          return;
        }
        if (data.genre) {
          setGenre(data.genre);
        }
        if (data.fuzzyTerms && data.fuzzyTerms.length > 0) {
          setFuzzyTerms(data.fuzzyTerms);
        }
        setDeconstructResult(data);
        setAiScanned(true);
      } else {
        setError(res.error || '拆解失败，请稍后重试');
      }
    } catch (_err) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [rawMaterial, materialCard, setDeconstructResult, skipStep, goNext]);

  var handleConfirm = function () {
    var result: DeconstructResult = {
      fuzzyTerms: fuzzyTerms,
      replacements: fuzzyTerms.map(function (ft) {
        return { original: ft.term, replacement: ft.replacement };
      }),
      genre: genre,
    };
    setDeconstructResult(result);
    completeStep(4);
    goNext();
  };

  var handleSkip = function () {
    skipStep(4);
    goNext();
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Step 4：概念拆解
        </h2>
        <p className="text-sm text-gray-500">
          扫描模糊大词，替换成人话
        </p>
      </div>

      {/* Genre selector */}
      <div className="flex items-center gap-3">
        <label
          htmlFor="genre-select"
          className="text-sm font-medium text-gray-700 flex-shrink-0"
        >
          文章类型：
        </label>
        <select
          id="genre-select"
          value={genre}
          onChange={handleGenreChange}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-all min-w-[180px]"
          aria-label="选择文章体裁类型"
        >
          {GENRE_OPTIONS.map(function (opt) {
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            );
          })}
        </select>
        <span className="text-xs text-gray-400">
          用于标题生成时匹配触发器风格
        </span>
      </div>

      {/* Raw material preview */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <span>{'\u{1F4C4}'}</span>
            <span>原始素材</span>
          </h3>
          <span className="text-xs text-gray-400">
            {rawMaterial.length} 字
          </span>
        </div>
        <div className="max-h-[200px] overflow-y-auto bg-gray-50 rounded-lg p-4">
          {rawMaterial ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {rawMaterial.length > 800
                ? rawMaterial.slice(0, 800) + '...'
                : rawMaterial}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">
              暂无素材。请返回上一步获取或粘贴素材。
            </p>
          )}
        </div>
      </Card>

      {/* Self-check prompt card */}
      <div className={AMBER_CARD + ' flex items-start gap-3'}>
        <span className="text-amber-500 text-lg flex-shrink-0">{'⚠️'}</span>
        <div>
          <p className="text-sm font-medium text-amber-800 mb-0.5">
            去掉这个词，我还能用大白话说清楚吗？
          </p>
          <p className="text-xs text-amber-700">
            如果不能——说明你在用模糊词渲染，读者看完只会觉得“这人说了一堆正确的废话”。
          </p>
        </div>
      </div>

      {/* AI scan button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            本地扫描到 {detectedWords.length} 个模糊词
          </span>
          {aiScanned && (
            <Badge variant="success">AI 已扫描</Badge>
          )}
        </div>
        <Button
          variant="primary"
          size="md"
          loading={loading}
          disabled={!rawMaterial.trim()}
          onClick={handleAiScan}
        >
          {'\u{1F50D}'} AI 扫描模糊词
        </Button>
      </div>

      {/* Auto-skip green card */}
      {autoSkipped && noteMessage && (
        <div className={GREEN_CARD + ' flex items-start gap-3'}>
          <span className="text-green-500 text-lg flex-shrink-0">{'✅'}</span>
          <div>
            <p className="text-sm font-medium text-green-800 mb-0.5">
              {noteMessage}
            </p>
            <p className="text-xs text-green-700">
              正在自动跳转到标题生成步骤...
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Detected fuzzy words list */}
      {detectedWords.length > 0 && !autoSkipped && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <span>{'\u{1F50D}'}</span>
            <span>检测到的模糊词</span>
            <Badge variant="warning">
              {pendingWords.length} 个待处理
            </Badge>
          </h3>

          {detectedWords.map(function (word) {
            var isConfirmed = confirmedTerms.has(word.index);
            var isSkipped = skippedTerms.has(word.index);
            var isResolved = isConfirmed || isSkipped;

            return (
              <Card
                key={word.index}
                padding="md"
                className={
                  'transition-all duration-200 ' +
                  (isSkipped ? 'opacity-50' : '') +
                  (isConfirmed ? 'border-green-300 bg-green-50' : '')
                }
              >
                <div className="flex items-start gap-4">
                  {/* Status indicator */}
                  <div className="flex-shrink-0 pt-0.5">
                    {isConfirmed && (
                      <StatusIcon status="pass" className="text-lg" />
                    )}
                    {isSkipped && (
                      <StatusIcon status="skipped" className="text-lg" />
                    )}
                    {!isResolved && (
                      <span className="inline-block w-5 h-5 rounded-full bg-red-100 text-red-600 text-xs text-center leading-5 font-bold">
                        !
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Original term */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={TERM_BADGE}>{word.term}</span>
                      <span className="text-gray-400 text-sm">{'→'}</span>
                      <span className="text-green-700 font-medium text-sm">
                        {word.replacement}
                      </span>
                    </div>

                    {/* Context snippet */}
                    <p className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-1.5 leading-relaxed">
                      {word.context}
                    </p>

                    {/* Action buttons */}
                    {!isResolved && (
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={function () {
                            handleConfirmTerm(word.index);
                          }}
                          aria-label={
                            '确认替换 ' + word.term
                          }
                        >
                          确认替换
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={function () {
                            handleSkipTerm(word.index);
                          }}
                          aria-label={
                            '跳过 ' + word.term
                          }
                        >
                          跳过
                        </Button>
                      </div>
                    )}

                    {isConfirmed && (
                      <p className="text-xs text-green-600">
                        {'✅'} 已替换
                      </p>
                    )}
                    {isSkipped && (
                      <p className="text-xs text-gray-400">
                        已跳过
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state - no fuzzy words detected */}
      {detectedWords.length === 0 && !loading && !autoSkipped && (
        <Card padding="lg">
          <div className="text-center py-6">
            <span className="text-4xl">{'✨'}</span>
            <h3 className="text-lg font-semibold text-gray-800 mt-3 mb-1">
              未检测到模糊词
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              你的素材写得很具体，或者点击 AI 扫描进行更深入检查
            </p>
          </div>
        </Card>
      )}

      {/* AI-result fuzzy terms (from API, merged into fuzzyTerms state) */}
      {fuzzyTerms.length > 0 && aiScanned && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
            <Badge variant="info">AI 分析</Badge>
            <span>AI 识别到 {fuzzyTerms.length} 个额外模糊词</span>
          </h3>
          <Card padding="md">
            <div className="space-y-2">
              {fuzzyTerms.map(function (ft, i) {
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm py-1.5 px-3 bg-gray-50 rounded-lg"
                  >
                    <span className={RED_TEXT}>{ft.term}</span>
                    <span className="text-gray-400">{'→'}</span>
                    <span className="text-green-700">{ft.replacement}</span>
                    {ft.reason && (
                      <span className="text-xs text-gray-400 ml-auto">
                        {ft.reason}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Action bar */}
      {!autoSkipped && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <Button variant="ghost" size="md" onClick={goPrev}>
            上一步
          </Button>
          <div className="flex gap-3">
            <Button variant="ghost" size="md" onClick={handleSkip}>
              跳过
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!allResolved && detectedWords.length > 0}
              onClick={handleConfirm}
            >
              确认，生成标题
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step4Deconstruct;
