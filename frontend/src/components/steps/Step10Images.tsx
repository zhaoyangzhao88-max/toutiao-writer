import React, { useState, useCallback, type FC } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { exportApi } from '../../lib/api';
import { IMAGE_STYLES } from '../../lib/constants';
import type { ImageSlot } from '../../types/workflow';

/* ------------------------------------------------------------------ */
/*  Shimmer placeholder for loading images                               */
/* ------------------------------------------------------------------ */

var ImageShimmer: FC = function () {
  return (
    <div className="animate-pulse">
      <div className="aspect-video bg-gray-200 rounded-lg" />
      <div className="mt-2 space-y-1.5">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Unsplash search result thumbnail                                     */
/* ------------------------------------------------------------------ */

interface UnsplashThumb {
  id: string;
  thumbUrl: string;
  regularUrl: string;
  alt: string;
  author: string;
}

interface ImageSlotCardProps {
  slot: ImageSlot;
  index: number;
  keywords: string;
  topic: string;
  searching: boolean;
  results: UnsplashThumb[];
  searchError: string | null;
  onTopicChange: (v: string) => void;
  onKeywordsChange: (v: string) => void;
  onSearch: () => void;
  onSelectImage: (thumb: UnsplashThumb) => void;
}

var ImageSlotCard: FC<ImageSlotCardProps> = function ({
  slot,
  index,
  keywords,
  topic,
  searching,
  results,
  searchError,
  onTopicChange,
  onKeywordsChange,
  onSearch,
  onSelectImage,
}) {
  var styleIndex = index % IMAGE_STYLES.length;
  var styleConfig = IMAGE_STYLES[styleIndex];
  var hasSelected = !!slot.url;
  var showResults = results.length > 0;

  return (
    <Card padding="md" className="flex flex-col gap-3">
      {/* Slot header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
            {index + 1}
          </span>
          <Badge variant="info">
            {styleConfig.emoji + ' ' + styleConfig.label}
          </Badge>
        </div>
        {hasSelected && (
          <span className="text-xs text-green-600 font-medium">
            {'✅ 已选择'}
          </span>
        )}
      </div>

      {/* Topic input */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {'图片主题（中文）'}
        </label>
        <input
          type="text"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
          placeholder={'例如：城市繁华街景'}
          value={topic}
          onChange={function (e) { onTopicChange(e.target.value); }}
        />
      </div>

      {/* Keywords input */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {'搜索关键词（英文）'}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            placeholder={'e.g. city skyline night'}
            value={keywords}
            onChange={function (e) { onKeywordsChange(e.target.value); }}
            onKeyDown={function (e) {
              if (e.key === 'Enter') { onSearch(); }
            }}
          />
          <Button
            variant="primary"
            size="sm"
            loading={searching}
            disabled={!keywords.trim()}
            onClick={onSearch}
          >
            {'🔍 搜索'}
          </Button>
        </div>
      </div>

      {/* Search error */}
      {searchError && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {searchError}
        </div>
      )}

      {/* Search results preview */}
      {showResults && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            {'搜索结果（' + results.length + ' 张）'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {results.map(function (thumb) {
              var isSelected = slot.unsplashUrl === thumb.regularUrl;
              var borderClass = isSelected
                ? 'ring-2 ring-blue-500 ring-offset-1 scale-105'
                : 'border border-gray-200 hover:border-blue-300 hover:shadow-sm';

              return (
                <button
                  key={thumb.id}
                  type="button"
                  className={
                    'relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 focus:outline-none ' +
                    borderClass
                  }
                  onClick={function () { onSelectImage(thumb); }}
                  title={thumb.alt}
                >
                  <img
                    src={thumb.thumbUrl}
                    alt={thumb.alt}
                    className="w-full aspect-video object-cover"
                    loading="lazy"
                  />
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                      {'✓'}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected image preview */}
      {hasSelected && slot.url && (
        <div className="relative rounded-lg overflow-hidden border-2 border-blue-400">
          <img
            src={slot.url}
            alt={slot.topic || ('插图 ' + (index + 1))}
            className="w-full aspect-video object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <p className="text-xs text-white truncate">
              {slot.topic || ('插图 ' + (index + 1))}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/*  Skeleton loading for the full page                                   */
/* ------------------------------------------------------------------ */

var SkeletonSlots: FC = function () {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4].map(function (i) {
          return (
            <div key={i} className="border border-gray-200 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-200" />
                <div className="h-5 bg-gray-200 rounded w-20" />
              </div>
              <div className="h-9 bg-gray-200 rounded w-full" />
              <div className="h-9 bg-gray-200 rounded w-full" />
              <div className="h-8 bg-gray-200 rounded w-20" />
              <div className="aspect-video bg-gray-200 rounded-lg" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Empty state                                                          */
/* ------------------------------------------------------------------ */

var EmptyState: FC<{ onAutoSuggest: () => void; loading: boolean }> = function ({ onAutoSuggest, loading }) {
  return (
    <Card padding="lg">
      <div className="text-center py-8">
        <span className="text-5xl">{'🖼️'}</span>
        <h3 className="text-lg font-semibold text-gray-800 mt-3 mb-1">
          {'尚未配图'}
        </h3>
        <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
          {'5张图片，5种风格交替。为每个插图位置设定主题和关键词，搜索 Unsplash 高质量图片。'}
        </p>
        <Button
          variant="primary"
          size="md"
          loading={loading}
          onClick={onAutoSuggest}
        >
          {'🤖 自动建议'}
        </Button>
        <p className="text-xs text-gray-400 mt-2">
          {'AI 将根据文章内容自动生成 5 个插图位的关键词'}
        </p>
      </div>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/*  Main component                                                       */
/* ------------------------------------------------------------------ */

var Step10Images: FC = function () {
  var store = useWorkflowStore();
  var imageSlots = store.imageSlots;
  var setImageSlots = store.setImageSlots;
  var updateImageSlot = store.updateImageSlot;
  var article = store.article;
  var completeStep = store.completeStep;
  var goNext = store.goNext;
  var goPrev = store.goPrev;

  var [autoLoading, setAutoLoading] = useState(false);
  var [autoError, setAutoError] = useState<string | null>(null);
  /* Per-slot search state */
  var [searchingSlot, setSearchingSlot] = useState<number | null>(null);
  var [searchResults, setSearchResults] = useState<Record<number, UnsplashThumb[]>>({});
  var [searchErrors, setSearchErrors] = useState<Record<number, string | null>>({});

  /* Local topic/keywords editing state (synced on blur or search) */
  var [localTopics, setLocalTopics] = useState<Record<number, string>>({});
  var [localKeywords, setLocalKeywords] = useState<Record<number, string>>({});

  /* Initialize slots if empty */
  var slots = imageSlots.length > 0 ? imageSlots : [];

  var hasSlots = slots.length > 0;

  /* Ensure 5 slots exist when auto-suggest is triggered */
  var ensureFiveSlots = useCallback(function (): ImageSlot[] {
    if (slots.length >= 5) return slots;
    var newSlots = slots.slice();
    for (var i = newSlots.length; i < 5; i++) {
      var styleIndex = i % IMAGE_STYLES.length;
      var styleKey = IMAGE_STYLES[styleIndex].value;
      newSlots.push({
        index: i,
        topic: '',
        keywords: '',
        style: styleKey as ImageSlot['style'],
      });
    }
    return newSlots;
  }, [slots]);

  /* Auto-suggest: AI generates keywords for all 5 slots based on article */
  var handleAutoSuggest = useCallback(async function () {
    setAutoLoading(true);
    setAutoError(null);

    try {
      var res = await exportApi.suggestImages({ article: article || '' });
      if (res.success && res.data) {
        var data = res.data as unknown as { suggestions: Array<{ topic: string; keywords: string; reason: string }> };
        var suggestions = data.suggestions || [];

        var baseSlots = ensureFiveSlots();
        var updatedSlots = baseSlots.map(function (slot, i) {
          var sug = suggestions[i] || { topic: '配图', keywords: 'photo image', reason: '' };
          return {
            ...slot,
            topic: sug.topic,
            keywords: sug.keywords,
          };
        });

        setImageSlots(updatedSlots);

        var newTopics: Record<number, string> = {};
        var newKeywords: Record<number, string> = {};
        updatedSlots.forEach(function (s) {
          newTopics[s.index] = s.topic;
          newKeywords[s.index] = s.keywords;
        });
        setLocalTopics(newTopics);
        setLocalKeywords(newKeywords);
      } else {
        setAutoError(res.error || 'AI 建议失败');
      }
    } catch (_err) {
      setAutoError('网络错误');
    }

    setAutoLoading(false);
  }, [article, ensureFiveSlots, setImageSlots]);

  /* Search images for a specific slot */
  var handleSearch = useCallback(async function (slotIndex: number) {
    var kw = localKeywords[slotIndex] || slots[slotIndex]?.keywords || '';
    if (!kw.trim()) return;

    setSearchingSlot(slotIndex);
    setSearchErrors(function (prev) { return { ...prev, [slotIndex]: null }; });

    try {
      var res = await exportApi.images(kw);
      if (res.success && res.data) {
        var data = res.data as unknown as { results?: UnsplashThumb[]; placeholderUrls?: string[]; source?: string };
        var results = data.results || [];
        // Use placeholder URLs as fallback when no Unsplash API key configured
        if (results.length === 0 && data.placeholderUrls && data.placeholderUrls.length > 0) {
          results = data.placeholderUrls.map(function (url, i) {
            return { id: 'ph-' + i, thumbUrl: url, regularUrl: url, alt: 'Placeholder image ' + (i + 1), author: 'Unsplash' };
          });
        }
        results = results.slice(0, 3);
        setSearchResults(function (prev) { return { ...prev, [slotIndex]: results }; });
        if (results.length === 0) {
          setSearchErrors(function (prev) { return { ...prev, [slotIndex]: '未找到相关图片，请更换关键词重试' }; });
        }
      } else {
        setSearchErrors(function (prev) { return { ...prev, [slotIndex]: res.error || '搜索失败' }; });
      }
    } catch (_err) {
      setSearchErrors(function (prev) { return { ...prev, [slotIndex]: '网络错误，请稍后重试' }; });
    } finally {
      setSearchingSlot(null);
    }
  }, [slots, localKeywords]);

  /* Select an image for a slot */
  var handleSelectImage = useCallback(function (slotIndex: number, thumb: UnsplashThumb) {
    var topic = localTopics[slotIndex] || slots[slotIndex]?.topic || '';
    updateImageSlot(slotIndex, {
      url: thumb.regularUrl,
      unsplashUrl: thumb.regularUrl,
      topic: topic,
      keywords: localKeywords[slotIndex] || slots[slotIndex]?.keywords || '',
    });
  }, [slots, localTopics, localKeywords, updateImageSlot]);

  /* Handle confirm — persist edits and fill placeholder URLs for empty slots */
  var handleConfirm = useCallback(function () {
    /* Persist current local edits to store */
    var currentSlots = slots.length >= 5 ? slots : ensureFiveSlots();
    var updatedSlots = currentSlots.map(function (slot) {
      var filled = {
        ...slot,
        topic: localTopics[slot.index] || slot.topic || '',
        keywords: localKeywords[slot.index] || slot.keywords || '',
      };
      // If slot has no image URL, generate a placeholder so DOCX appendix shows something
      if (!filled.url) {
        filled.url = 'https://images.unsplash.com/photo-' + (slot.index + 1) + '?w=400&h=300&fit=crop';
      }
      return filled;
    });
    setImageSlots(updatedSlots);
    completeStep(10);
    goNext();
  }, [slots, ensureFiveSlots, localTopics, localKeywords, setImageSlots, completeStep, goNext]);

  /* Render the 5-slot grid */
  var renderSlots = function () {
    var displaySlots = slots.length >= 5 ? slots : ensureFiveSlots();

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displaySlots.map(function (slot) {
          var idx = slot.index;
          var topic = localTopics[idx] !== undefined ? localTopics[idx] : (slot.topic || '');
          var keywords = localKeywords[idx] !== undefined ? localKeywords[idx] : (slot.keywords || '');
          var isSearching = searchingSlot === idx;
          var results = searchResults[idx] || [];
          var searchErr = searchErrors[idx] || null;

          return (
            <ImageSlotCard
              key={idx}
              slot={slot}
              index={idx}
              keywords={keywords}
              topic={topic}
              searching={isSearching}
              results={results}
              searchError={searchErr}
              onTopicChange={function (v) {
                setLocalTopics(function (prev) { return { ...prev, [idx]: v }; });
              }}
              onKeywordsChange={function (v) {
                setLocalKeywords(function (prev) { return { ...prev, [idx]: v }; });
              }}
              onSearch={function () { handleSearch(idx); }}
              onSelectImage={function (thumb) { handleSelectImage(idx, thumb); }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Step 10：配图
          </h2>
          <p className="text-sm text-gray-500">
            5张图片，5种风格交替
          </p>
        </div>
        {hasSlots && (
          <Button
            variant="secondary"
            size="md"
            loading={autoLoading}
            onClick={handleAutoSuggest}
          >
            {'🤖 自动建议'}
          </Button>
        )}
      </div>

      {/* Auto-suggest error */}
      {autoError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 flex items-start gap-2">
          <span className="flex-shrink-0">{'⚠️'}</span>
          <span>{autoError}</span>
          <button
            type="button"
            className="ml-auto text-red-500 hover:text-red-700 flex-shrink-0"
            onClick={function () { setAutoError(null); }}
            aria-label="关闭错误提示"
          >
            {'✕'}
          </button>
        </div>
      )}

      {/* Loading state */}
      {autoLoading && <SkeletonSlots />}

      {/* Empty state */}
      {!autoLoading && !hasSlots && (
        <EmptyState onAutoSuggest={handleAutoSuggest} loading={autoLoading} />
      )}

      {/* Slots grid */}
      {!autoLoading && hasSlots && renderSlots()}

      {/* Bottom actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <Button variant="ghost" size="md" onClick={goPrev}>
          {'上一步'}
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleConfirm}
        >
          {'确认配图，生成文档'}
        </Button>
      </div>
    </div>
  );
};

export default Step10Images;
