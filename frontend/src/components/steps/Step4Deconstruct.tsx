import React, { useState, useEffect, useCallback, type FC } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { writingApi } from '../../lib/api';
import { GENRE_OPTIONS } from '../../lib/constants';
import type { DeconstructResult, FuzzyTerm, ConcreteSuggestion, GenreType } from '../../types/workflow';

const Step4Deconstruct: FC = function () {
  var store = useWorkflowStore();
  var materialCard = store.materialCard;
  var deconstructResult = store.deconstructResult;
  var guideAnswers = store.guideAnswers;
  var setDeconstructResult = store.setDeconstructResult;
  var completeStep = store.completeStep;
  var skipStep = store.skipStep;
  var goNext = store.goNext;
  var goPrev = store.goPrev;

  var initialGenre: GenreType = deconstructResult?.genre || 'business';
  var [genre, setGenre] = useState<GenreType>(initialGenre);
  var [fuzzyTerms, setFuzzyTerms] = useState<FuzzyTerm[]>(deconstructResult?.fuzzyTerms || []);
  var [concreteSuggestions, setConcreteSuggestions] = useState<ConcreteSuggestion[]>(
    (deconstructResult as any)?.concreteSuggestions || []
  );
  var [loading, setLoading] = useState(false);
  var [error, setError] = useState<string | null>(null);
  var [autoSkipped, setAutoSkipped] = useState(false);
  var [scanned, setScanned] = useState(!!deconstructResult);

  var handleGenreChange = function (e: React.ChangeEvent<HTMLSelectElement>) {
    setGenre(e.target.value as GenreType);
  };

  // Auto-scan on mount
  var doScan = useCallback(async function () {
    if (!materialCard || scanned) return;
    setLoading(true);
    setError(null);
    try {
      var res = await writingApi.deconstruct({
  material_card: materialCard,
  guide_answers: guideAnswers as Record<string, unknown> | undefined,
});
      if (res.success && res.data) {
        var data = res.data as unknown as DeconstructResult & { concreteSuggestions?: ConcreteSuggestion[] };
        setDeconstructResult(data as DeconstructResult);

        if (data.note === '此篇素材具体，跳过概念拆解' || (!data.fuzzyTerms || data.fuzzyTerms.length === 0) && (!data.concreteSuggestions || data.concreteSuggestions.length === 0)) {
          setAutoSkipped(true);
          skipStep(4);
          setTimeout(function () { goNext(); }, 1500);
          return;
        }

        if (data.genre) setGenre(data.genre);
        if (data.fuzzyTerms) setFuzzyTerms(data.fuzzyTerms);
        if (data.concreteSuggestions) setConcreteSuggestions(data.concreteSuggestions);
        setScanned(true);
      } else {
        setError(res.error || '扫描失败');
      }
    } catch (_err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }, [materialCard, scanned, setDeconstructResult, skipStep, goNext]);

  useEffect(function () {
    doScan();
  }, [doScan]);

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

  var hasFuzzy = fuzzyTerms.length > 0;
  var hasConcrete = concreteSuggestions.length > 0;
  var hasAnything = hasFuzzy || hasConcrete;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Step 4：概念拆解
        </h2>
        <p className="text-sm text-gray-500">
          把抽象概念变成具体表达，让文章更适合头条读者
        </p>
      </div>

      {/* Genre selector */}
      <div className="flex items-center gap-3">
        <label htmlFor="genre-select" className="text-sm font-medium text-gray-700 flex-shrink-0">
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
            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
          })}
        </select>
        <span className="text-xs text-gray-400">用于标题生成时匹配触发器风格</span>
      </div>

      {/* Loading state */}
      {loading && (
        <Card padding="lg">
          <div className="flex flex-col items-center py-6 space-y-3">
            <svg className="h-8 w-8 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-sm font-medium text-gray-700">正在分析素材...</p>
            <p className="text-xs text-gray-400">检查是否有模糊词和需要具体化的表达</p>
          </div>
        </Card>
      )}

      {/* Auto-skip: content already specific enough */}
      {autoSkipped && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <span className="text-green-500 text-lg flex-shrink-0">✅</span>
          <div>
            <p className="text-sm font-medium text-green-800">素材已经很具体了，直接写就行</p>
            <p className="text-xs text-green-700 mt-0.5">正在自动跳转到标题生成步骤...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 flex items-start gap-2">
          <span>❌</span>
          <div className="flex-1">{error}</div>
          <Button variant="ghost" size="sm" onClick={doScan}>重试</Button>
        </div>
      )}

      {/* Results */}
      {!loading && !autoSkipped && hasAnything && scanned && (
        <div className="space-y-4">
          {/* Concrete suggestions (new) */}
          {hasConcrete && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="info">{concreteSuggestions.length} 条具体化建议</Badge>
                <span className="text-sm text-gray-500">用素材中的数据/案例代替抽象描述</span>
              </div>

              {concreteSuggestions.map(function (cs, i) {
                return (
                  <Card key={i} padding="md" className="border-blue-200">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-gray-400 line-through">{cs.abstract}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-700 font-medium text-sm">→ {cs.concrete}</span>
                        </div>
                        {cs.why && (
                          <p className="text-xs text-gray-500">{cs.why}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Fuzzy words */}
          {hasFuzzy && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="warning">{fuzzyTerms.length} 个模糊词</Badge>
                <span className="text-sm text-gray-500">用大白话替换</span>
              </div>

              {fuzzyTerms.map(function (ft, i) {
                return (
                  <Card key={i} padding="md" className="border-amber-200">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                            {ft.term}
                          </span>
                          <span className="text-gray-400 text-sm">→</span>
                          <span className="text-green-700 font-medium text-sm">{ft.replacement}</span>
                        </div>
                        {ft.reason && (
                          <p className="text-xs text-gray-500">{ft.reason}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Summary tip */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <p>💡 头条爆款 = 具体 + 冲突 + 共鸣。写作时多用数据、案例、具体场景，少用抽象概念。</p>
          </div>
        </div>
      )}

      {/* Empty state: nothing found */}
      {!loading && !autoSkipped && !hasAnything && scanned && (
        <Card padding="lg">
          <div className="text-center py-6">
            <span className="text-4xl">✨</span>
            <h3 className="text-lg font-semibold text-gray-800 mt-3 mb-1">素材很具体</h3>
            <p className="text-sm text-gray-500">没有需要拆解的模糊词或抽象表达</p>
          </div>
        </Card>
      )}

      {/* Action bar */}
      {!autoSkipped && scanned && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <Button variant="ghost" size="md" onClick={goPrev}>上一步</Button>
          <Button variant="primary" size="md" onClick={handleConfirm}>
            确认，生成标题
          </Button>
        </div>
      )}
    </div>
  );
};

export default Step4Deconstruct;
