import React, { useState, type FC } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { materialApi } from '../../lib/api';
import type { MaterialMode, FetchedContent, SearchResult } from '../../types/workflow';

type ModeTab = { mode: MaterialMode; label: string; emoji: string };

const MODE_TABS: ModeTab[] = [
  { mode: 'url', label: 'URL 抓取', emoji: '\u{1F517}' },
  { mode: 'draft', label: '草稿粘贴', emoji: '✏️' },
  { mode: 'topic', label: '话题搜索', emoji: '\u{1F50D}' },
];

const SUCCESS_COLORS = 'bg-green-50 border-green-200 text-green-900';
const ERROR_COLORS = 'bg-red-50 border-red-200 text-red-900';
const INFO_COLORS = 'bg-blue-50 border-blue-200 text-blue-900';

const Step1Material: FC = () => {
  const {
    materialMode,
    setMaterialMode,
    rawInput,
    setRawInput,
    fetchedContent,
    setFetchedContent,
    searchResults,
    setSearchResults,
    completeStep,
    goNext,
    resetFromStep,
  } = useWorkflowStore();

  const [url, setUrl] = useState('');
  const [draftText, setDraftText] = useState(rawInput || '');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetStates = () => {
    setError(null);
    setSuccess(false);
  };

  const handleModeSwitch = (mode: MaterialMode) => {
    setMaterialMode(mode);
    resetStates();
  };

  const handleUrlFetch = async () => {
    if (!url.trim()) return;
    resetStates();
    setLoading(true);
    try {
      resetFromStep(3); // Clear steps 3+ when fetching new material (preserve Step 2 guide answers)
      const res = await materialApi.fetch({ mode: 'url', url: url.trim() });
      if (res.success && res.data) {
        const content = res.data as unknown as FetchedContent;
        setFetchedContent(content);
        setSuccess(true);
      } else {
        setError(res.error || '抓取失败，请检查URL后重试');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDraftConfirm = () => {
    if (!draftText.trim()) return;
    resetFromStep(3); // Clear steps 3+ when using new draft (preserve Step 2 guide answers)
    setRawInput(draftText.trim());
    completeStep(1);
    goNext();
  };

  const handleTopicSearch = async () => {
    if (!topic.trim()) return;
    resetStates();
    setLoading(true);
    try {
      resetFromStep(3); // Clear steps 3+ when searching new topic (preserve Step 2 guide answers)
      const res = await materialApi.fetch({ mode: 'topic', topic: topic.trim() });
      if (res.success && res.data) {
        const results = res.data as unknown as SearchResult;
        setSearchResults(results);
        setSuccess(true);
      } else {
        setError(res.error || '搜索失败，请稍后重试');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicConfirm = () => {
    if (searchResults) {
      completeStep(1);
      goNext();
    }
  };

  const renderTabs = () => (
    <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
      {MODE_TABS.map((tab) => (
        <button
          key={tab.mode}
          onClick={() => handleModeSwitch(tab.mode)}
          className={
            'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ' +
            (materialMode === tab.mode
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700')
          }
        >
          <span>{tab.emoji}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );

  const renderUrlMode = () => (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        输入文章链接
      </label>
      <div className="flex gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); resetStates(); }}
          placeholder="https://mp.weixin.qq.com/s/..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          onKeyDown={(e) => { if (e.key === 'Enter') handleUrlFetch(); }}
        />
        <Button
          variant="primary"
          size="md"
          loading={loading}
          disabled={!url.trim()}
          onClick={handleUrlFetch}
        >
          抓取内容
        </Button>
      </div>
      <p className="text-xs text-gray-400">
        支持微信公众号、知乎、今日头条等主流内容平台链接
      </p>
    </div>
  );

  const renderDraftMode = () => (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        粘贴你的初稿或素材
      </label>
      <textarea
        value={draftText}
        onChange={(e) => setDraftText(e.target.value)}
        placeholder="将你收集的文章素材、初稿或灵感贴在这里..."
        rows={12}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-y"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          已输入 {draftText.length} 字
        </span>
        <Button
          variant="primary"
          size="lg"
          disabled={!draftText.trim()}
          onClick={handleDraftConfirm}
        >
          确认，进入下一步
        </Button>
      </div>
    </div>
  );

  const renderTopicMode = () => (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        输入想写的话题关键词
      </label>
      <div className="flex gap-3">
        <input
          type="text"
          value={topic}
          onChange={(e) => { setTopic(e.target.value); resetStates(); }}
          placeholder="例如：年轻人为什么不愿生孩子"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          onKeyDown={(e) => { if (e.key === 'Enter') handleTopicSearch(); }}
        />
        <Button
          variant="primary"
          size="md"
          loading={loading}
          disabled={!topic.trim()}
          onClick={handleTopicSearch}
        >
          搜索素材
        </Button>
      </div>
      <p className="text-xs text-gray-400">
        输入具体话题，AI将搜索相关文章和资料作为写作参考
      </p>
    </div>
  );

  const renderUrlSuccess = () => {
    if (!fetchedContent || !success) return null;
    return (
      <Card className={`mt-4 border ${SUCCESS_COLORS}`} padding="md">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="success">抓取成功</Badge>
            <span className="text-xs text-gray-500">
              来源: {fetchedContent.source}
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => { completeStep(1); goNext(); }}
          >
            确认，进入下一步
          </Button>
        </div>
        {fetchedContent.title && (
          <h4 className="font-semibold text-gray-900 mb-1">
            {fetchedContent.title}
          </h4>
        )}
        {fetchedContent.url && (
          <p className="text-xs text-gray-500 mb-2 truncate">
            {fetchedContent.url}
          </p>
        )}
        <div className="bg-white bg-opacity-60 rounded-lg p-3 text-sm text-gray-700 max-h-48 overflow-y-auto">
          <p className="whitespace-pre-wrap leading-relaxed">
            {fetchedContent.content.length > 600
              ? fetchedContent.content.slice(0, 600) + '...'
              : fetchedContent.content}
          </p>
        </div>
      </Card>
    );
  };

  const renderTopicSuccess = () => {
    if (!searchResults || !success) return null;
    return (
      <Card className={`mt-4 border ${INFO_COLORS}`} padding="md">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="info">搜索完成</Badge>
            <span className="text-xs text-gray-500">
              搜索词: {searchResults.query}
            </span>
            <span className="text-xs text-gray-400">
              ({searchResults.results.length} 条结果)
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleTopicConfirm}
          >
            确认，进入下一步
          </Button>
        </div>
        {searchResults.warning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3 text-xs text-yellow-800">
            {searchResults.warning}
          </div>
        )}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {searchResults.results.map((r, i) => (
            <div
              key={i}
              className="bg-white bg-opacity-60 rounded-lg p-3 text-sm"
            >
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-700 hover:underline"
              >
                {r.title}
              </a>
              <p className="text-gray-600 mt-0.5 text-xs leading-relaxed">
                {r.snippet}
              </p>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  const renderError = () => {
    if (!error) return null;
    return (
      <Card className={`mt-4 border ${ERROR_COLORS}`} padding="sm">
        <div className="flex items-center gap-2">
          <span className="text-red-500 font-bold">!</span>
          <p className="text-sm">{error}</p>
        </div>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">获取素材</h2>
        <p className="text-sm text-gray-500">
          选择一种方式输入你的写作素材，AI将帮你分析和提炼
        </p>
      </div>

      {renderTabs()}

      {materialMode === 'url' && renderUrlMode()}
      {materialMode === 'draft' && renderDraftMode()}
      {materialMode === 'topic' && renderTopicMode()}

      {materialMode === 'url' && (
        <>
          {renderUrlSuccess()}
          {renderError()}
        </>
      )}

      {materialMode === 'topic' && (
        <>
          {renderTopicSuccess()}
          {renderError()}
        </>
      )}
    </div>
  );
};

export default Step1Material;
