import React, { useState, type FC } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { materialApi } from '../../lib/api';
import type { MaterialCard } from '../../types/workflow';

interface EditableField {
  key: keyof MaterialCard;
  emoji: string;
  label: string;
  placeholder: string;
  multiline: boolean;
}

const FIELDS: EditableField[] = [
  {
    key: 'coreTopic',
    emoji: '\u{1F4CC}',
    label: '核心话题',
    placeholder: '一句话概括这篇文章要讲什么',
    multiline: false,
  },
  {
    key: 'keyData',
    emoji: '\u{1F4CA}',
    label: '关键数据',
    placeholder: '每行一个数据或事实\n例如：\n2024年出生人口降至902万\n00后平均跳槽周期缩短至9个月',
    multiline: true,
  },
  {
    key: 'cases',
    emoji: '\u{1F4D6}',
    label: '案例/故事',
    placeholder: '每行一个案例或故事片段\n例如：\n邻居老张被裁后开了间小面馆，月入2万\n朋友小刘裸辞做自媒体，3个月没收入',
    multiline: true,
  },
  {
    key: 'controversies',
    emoji: '⚔️',
    label: '争议点',
    placeholder: '每行一个有争议的观点或矛盾\n例如：\n公司说"家文化"却优先裁老员工\n专家说要多生，年轻人说养不起',
    multiline: true,
  },
  {
    key: 'goldenQuote',
    emoji: '✨',
    label: '金句候选',
    placeholder: '文章中最能打动人的一句话',
    multiline: false,
  },
];

const Step3Extract: FC = () => {
  const {
    fetchedContent,
    rawInput,
    materialCard,
    setMaterialCard,
    completeStep,
    goNext,
    goPrev,
  } = useWorkflowStore();

  const rawMaterial = fetchedContent?.content || rawInput || '';
  const rawTitle = fetchedContent?.title || '';

  const [card, setCard] = useState<MaterialCard>(
    materialCard || {
      coreTopic: '',
      keyData: [],
      cases: [],
      controversies: [],
      goldenQuote: '',
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (
    key: keyof MaterialCard,
    value: string
  ) => {
    if (key === 'coreTopic' || key === 'goldenQuote') {
      setCard((prev) => ({ ...prev, [key]: value }));
    } else {
      const lines = value
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      setCard((prev) => ({
        ...prev,
        [key]: lines,
      }));
    }
  };

  const getFieldValue = (key: keyof MaterialCard): string => {
    const val = card[key];
    if (Array.isArray(val)) {
      return val.join('\n');
    }
    return val || '';
  };

  const hasAnyContent = (): boolean => {
    return (
      card.coreTopic.length > 0 ||
      card.keyData.length > 0 ||
      card.cases.length > 0 ||
      card.controversies.length > 0 ||
      card.goldenQuote.length > 0
    );
  };

  const handleAiExtract = async () => {
    if (!rawMaterial.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await materialApi.extract({ raw_material: rawMaterial });
      if (res.success && res.data) {
        const extracted = res.data as unknown as MaterialCard;
        setCard({
          coreTopic: extracted.coreTopic || '',
          keyData: extracted.keyData || [],
          cases: extracted.cases || [],
          controversies: extracted.controversies || [],
          goldenQuote: extracted.goldenQuote || '',
        });
      } else {
        setError(res.error || '提炼失败，请稍后重试');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    setMaterialCard(card);
    completeStep(3);
    goNext();
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">素材提炼</h2>
        <p className="text-sm text-gray-500">
          AI帮你从原材料中提炼核心要素，也可以手动编辑
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: raw material */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <span>📄 原始素材</span>
              {rawTitle && (
                <Badge variant="default">{rawTitle}</Badge>
              )}
            </h3>
            <Button
              variant="primary"
              size="sm"
              loading={loading}
              disabled={!rawMaterial.trim()}
              onClick={handleAiExtract}
            >
              AI 自动提炼
            </Button>
          </div>
          <Card className="max-h-[600px] overflow-y-auto" padding="md">
            {rawMaterial ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {rawMaterial}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">
                暂无素材。请返回上一步获取或粘贴素材。
              </p>
            )}
          </Card>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}
        </div>

        {/* Right column: editable fields */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">
            ✏️ 素材卡片
          </h3>
          {FIELDS.map((field) => (
            <Card key={field.key} padding="sm">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <span>{field.emoji}</span>
                <span>{field.label}</span>
              </label>
              {field.multiline ? (
                <textarea
                  value={getFieldValue(field.key)}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-y bg-gray-50"
                />
              ) : (
                <input
                  type="text"
                  value={getFieldValue(field.key) as string}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50"
                />
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="md" onClick={goPrev}>
          上一步
        </Button>
        <Button
          variant="primary"
          size="md"
          disabled={!hasAnyContent()}
          onClick={handleConfirm}
        >
          确认，进入写作
        </Button>
      </div>
    </div>
  );
};

export default Step3Extract;
