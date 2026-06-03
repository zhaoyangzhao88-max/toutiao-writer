import React, { useState, useCallback, type FC } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import {
  AUDIENCE_OPTIONS, GOAL_OPTIONS, CONFLICT_OPTIONS,
  CONSTRAINT_OPTIONS, FEEDBACK_OPTIONS,
} from '../../lib/constants';
import type { GuideAnswers } from '../../types/workflow';

// ── Label lookup maps ──────────────────────────────────────────

const AUDIENCE_LABEL: Record<string, string> = {};
AUDIENCE_OPTIONS.forEach(function (o) { AUDIENCE_LABEL[o.value] = o.emoji + ' ' + o.label; });

const GOAL_LABEL: Record<string, string> = {};
GOAL_OPTIONS.forEach(function (o) { GOAL_LABEL[o.value] = o.emoji + ' ' + o.label; });

const CONFLICT_LABEL: Record<string, string> = {};
const CONFLICT_DESC: Record<string, string> = {};
CONFLICT_OPTIONS.forEach(function (o) { CONFLICT_LABEL[o.value] = o.emoji + ' ' + o.label; CONFLICT_DESC[o.value] = o.desc; });

const LENGTH_LABEL: Record<string, string> = {};
CONSTRAINT_OPTIONS.length.forEach(function (o) { LENGTH_LABEL[o.value] = o.label; });

const TONE_LABEL: Record<string, string> = {};
CONSTRAINT_OPTIONS.tone.forEach(function (o) { TONE_LABEL[o.value] = o.label; });

const TIMING_LABEL: Record<string, string> = {};
CONSTRAINT_OPTIONS.timing.forEach(function (o) { TIMING_LABEL[o.value] = o.label; });

const SENSITIVITY_LABEL: Record<string, string> = {};
CONSTRAINT_OPTIONS.sensitivity.forEach(function (o) { SENSITIVITY_LABEL[o.value] = o.label; });

const FEEDBACK_LABEL: Record<string, string> = {};
FEEDBACK_OPTIONS.forEach(function (o) { FEEDBACK_LABEL[o.value] = o.emoji + ' ' + o.label; });

// ── Helpers ─────────────────────────────────────────────────────

function chipRingClass(selected: boolean): string {
  return 'rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ' +
    (selected
      ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-500 border-blue-300'
      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300');
}

// ── Component ───────────────────────────────────────────────────

const Step2Guide: FC = function () {
  var store = useWorkflowStore();
  var guideAnswers = store.guideAnswers;
  var setGuideAnswers = store.setGuideAnswers;
  var completeStep = store.completeStep;
  var skipStep = store.skipStep;
  var goNext = store.goNext;
  var goPrev = store.goPrev;

  // Local draft initialised from store on mount
  var [draft, setDraft] = useState<GuideAnswers>(guideAnswers || {});

  // ── Audience (single select) ────────────────────────────────

  var handleAudienceSelect = useCallback(function (value: string) {
    setDraft(function (prev) {
      var next = { ...prev };
      if (prev.audience === value) {
        next.audience = undefined;
      } else {
        next.audience = value;
      }
      return next;
    });
  }, []);

  var handleAudienceNote = useCallback(function (text: string) {
    setDraft(function (prev) { return { ...prev, audienceNote: text || undefined }; });
  }, []);

  // ── Goal (multi select) ─────────────────────────────────────

  var handleGoalToggle = useCallback(function (value: string) {
    setDraft(function (prev) {
      var goals = prev.goals ? [...prev.goals] : [];
      var idx = goals.indexOf(value);
      if (idx >= 0) {
        goals.splice(idx, 1);
      } else {
        goals.push(value);
      }
      return { ...prev, goals: goals.length > 0 ? goals : undefined };
    });
  }, []);

  var handleQuickPick = useCallback(function () {
    setDraft(function (prev) {
      return { ...prev, goals: ['forward', 'change_mind', 'learn'] };
    });
  }, []);

  var handleGoalsNote = useCallback(function (text: string) {
    setDraft(function (prev) { return { ...prev, goalsNote: text || undefined }; });
  }, []);

  // ── Conflict (dropdown + text) ──────────────────────────────

  var handleConflictType = useCallback(function (value: string) {
    setDraft(function (prev) {
      return {
        ...prev,
        conflictType: (value || undefined) as GuideAnswers['conflictType'],
      };
    });
  }, []);

  var handleConflictText = useCallback(function (text: string) {
    setDraft(function (prev) { return { ...prev, conflict: text || undefined }; });
  }, []);

  // ── Constraints (4 sub-dimensions, each single select) ──────

  var handleConstraintSelect = useCallback(function (
    dimension: 'length' | 'tone' | 'timing' | 'sensitivity',
    value: string,
  ) {
    setDraft(function (prev) {
      var next = { ...prev };
      var keyMap: Record<string, keyof GuideAnswers> = {
        length: 'constraintLength',
        tone: 'constraintTone',
        timing: 'constraintTiming',
        sensitivity: 'constraintSensitivity',
      };
      var key = keyMap[dimension];
      if (prev[key] === value) {
        (next as Record<string, unknown>)[key] = undefined;
      } else {
        (next as Record<string, unknown>)[key] = value;
      }
      return next;
    });
  }, []);

  var handleConstraintNote = useCallback(function (text: string) {
    setDraft(function (prev) { return { ...prev, constraintNote: text || undefined }; });
  }, []);

  // ── Feedback (multi select) ─────────────────────────────────

  var handleFeedbackToggle = useCallback(function (value: string) {
    setDraft(function (prev) {
      var feedbacks = prev.feedbacks ? [...prev.feedbacks] : [];
      var idx = feedbacks.indexOf(value);
      if (idx >= 0) {
        feedbacks.splice(idx, 1);
      } else {
        feedbacks.push(value);
      }
      return { ...prev, feedbacks: feedbacks.length > 0 ? feedbacks : undefined };
    });
  }, []);

  var handleFeedbackNote = useCallback(function (text: string) {
    setDraft(function (prev) { return { ...prev, feedbackNote: text || undefined }; });
  }, []);

  // ── Expand / collapse ───────────────────────────────────────

  var [expanded, setExpanded] = useState<string | null>(null);

  var toggleExpand = useCallback(function (key: string) {
    setExpanded(function (prev) { return prev === key ? null : key; });
  }, []);

  // ── Derived booleans ────────────────────────────────────────

  var hasAnyAnswer = Boolean(
    draft.audience ||
    draft.audienceNote ||
    (draft.goals && draft.goals.length > 0) ||
    draft.goalsNote ||
    draft.conflict ||
    draft.conflictType ||
    draft.constraintLength ||
    draft.constraintTone ||
    draft.constraintTiming ||
    draft.constraintSensitivity ||
    draft.constraintNote ||
    (draft.feedbacks && draft.feedbacks.length > 0) ||
    draft.feedbackNote,
  );

  // ── Card-level filled flags ─────────────────────────────────

  var audienceFilled = Boolean(draft.audience || draft.audienceNote);
  var goalFilled = Boolean((draft.goals && draft.goals.length > 0) || draft.goalsNote);
  var conflictFilled = Boolean(draft.conflict || draft.conflictType);
  var constraintFilled = Boolean(
    draft.constraintLength || draft.constraintTone ||
    draft.constraintTiming || draft.constraintSensitivity ||
    draft.constraintNote,
  );
  var feedbackFilled = Boolean((draft.feedbacks && draft.feedbacks.length > 0) || draft.feedbackNote);

  // ── Confirm / skip ──────────────────────────────────────────

  var handleConfirm = useCallback(function () {
    setGuideAnswers(draft);
    completeStep(2);
    goNext();
  }, [draft, setGuideAnswers, completeStep, goNext]);

  var handleSkip = useCallback(function () {
    skipStep(2);
    goNext();
  }, [skipStep, goNext]);

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">好问题引导</h2>
        <p className="text-sm text-gray-500">
          五个关键问题帮你看清故事的本质，把现象变成好文章
        </p>
      </div>

      {/* Amber warning banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <span className="text-amber-500 text-lg flex-shrink-0">{'⚠️'}</span>
        <div>
          <p className="text-sm font-medium text-amber-800 mb-0.5">
            先钉死现象，再分析原因
          </p>
          <p className="text-xs text-amber-700">
            好的文章从具体现象出发。先问「发生了什么」，别跳「为什么」——那是正文要展开的。
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {/* ═══ CARD 1: 对象 Audience (single select) ═══ */}
        <Card hover padding="none" className="overflow-hidden">
          <button
            type="button"
            onClick={function () { toggleExpand('audience'); }}
            className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl flex-shrink-0">{'👥'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">对象</span>
                {audienceFilled && <Badge variant="success">已填写</Badge>}
                {draft.audience && (
                  <Badge variant="info">{AUDIENCE_LABEL[draft.audience] || draft.audience}</Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                这篇文章写给谁看？越具体越好
              </p>
            </div>
            <span
              className={'text-gray-400 transition-transform duration-200 text-sm flex-shrink-0 ' +
                (expanded === 'audience' ? 'rotate-90' : '')}
            >
              {'▶'}
            </span>
          </button>

          {expanded === 'audience' && (
            <div className="px-5 pb-5 pt-0 space-y-4 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3">
                {AUDIENCE_OPTIONS.map(function (opt) {
                  var isSel = draft.audience === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      title={opt.desc}
                      onClick={function () { handleAudienceSelect(opt.value); }}
                      className={chipRingClass(isSel)}
                    >
                      <span className="mr-1.5">{opt.emoji}</span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={draft.audienceNote || ''}
                onChange={function (e) { handleAudienceNote(e.target.value); }}
                placeholder="其他人群..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          )}
        </Card>

        {/* ═══ CARD 2: 目标 Goal (multi select) ═══ */}
        <Card hover padding="none" className="overflow-hidden">
          <button
            type="button"
            onClick={function () { toggleExpand('goal'); }}
            className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl flex-shrink-0">{'🎯'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900">目标</span>
                {goalFilled && <Badge variant="success">已填写</Badge>}
                {(draft.goals || []).map(function (g) {
                  return (
                    <Badge key={g} variant="info">{GOAL_LABEL[g] || g}</Badge>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                读者看完后应该做什么？想什么？
              </p>
            </div>
            <span
              className={'text-gray-400 transition-transform duration-200 text-sm flex-shrink-0 ' +
                (expanded === 'goal' ? 'rotate-90' : '')}
            >
              {'▶'}
            </span>
          </button>

          {expanded === 'goal' && (
            <div className="px-5 pb-5 pt-0 space-y-4 border-t border-gray-100">
              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={handleQuickPick}
                  className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  选常用
                </button>
                <span className="text-xs text-gray-400">
                  转发分享 + 改变观念 + 学到东西
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {GOAL_OPTIONS.map(function (opt) {
                  var isSel = (draft.goals || []).indexOf(opt.value) >= 0;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      title={opt.desc}
                      onClick={function () { handleGoalToggle(opt.value); }}
                      className={chipRingClass(isSel)}
                    >
                      <span className="mr-1.5">{opt.emoji}</span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={draft.goalsNote || ''}
                onChange={function (e) { handleGoalsNote(e.target.value); }}
                placeholder="其他目标..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          )}
        </Card>

        {/* ═══ CARD 3: 冲突 Conflict (dropdown + textarea) ═══ */}
        <Card hover padding="none" className="overflow-hidden">
          <button
            type="button"
            onClick={function () { toggleExpand('conflict'); }}
            className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl flex-shrink-0">{'⚡'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">冲突</span>
                {conflictFilled && <Badge variant="success">已填写</Badge>}
                {draft.conflictType && (
                  <Badge variant="info">
                    {CONFLICT_LABEL[draft.conflictType] || draft.conflictType}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                故事的核心矛盾是什么？没有冲突就没有好文章
              </p>
              {expanded !== 'conflict' && draft.conflict && (
                <p className="text-sm text-gray-700 mt-1.5 truncate">
                  {draft.conflict.length > 60
                    ? draft.conflict.slice(0, 60) + '...'
                    : draft.conflict}
                </p>
              )}
            </div>
            <span
              className={'text-gray-400 transition-transform duration-200 text-sm flex-shrink-0 ' +
                (expanded === 'conflict' ? 'rotate-90' : '')}
            >
              {'▶'}
            </span>
          </button>

          {expanded === 'conflict' && (
            <div className="px-5 pb-5 pt-0 space-y-4 border-t border-gray-100 pt-3">
              <select
                value={draft.conflictType || ''}
                onChange={function (e) { handleConflictType(e.target.value); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="">-- 选择冲突类型 --</option>
                {CONFLICT_OPTIONS.map(function (ct) {
                  return (
                    <option key={ct.value} value={ct.value}>
                      {ct.emoji + ' ' + ct.label + ' — ' + ct.desc}
                    </option>
                  );
                })}
              </select>
              <textarea
                value={draft.conflict || ''}
                onChange={function (e) { handleConflictText(e.target.value); }}
                placeholder={'例如：公司承诺"家文化"却在行情不好时优先裁掉老员工...\n\n越具体越好——不是「贫富差距大」，而是「同一个写字楼里，\n5楼的外卖骑手送了3年餐，从没走进过50楼的写字楼餐厅」。'}
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-y"
              />
            </div>
          )}
        </Card>

        {/* ═══ CARD 4: 约束 Constraints (4 sub-dimensions) ═══ */}
        <Card hover padding="none" className="overflow-hidden">
          <button
            type="button"
            onClick={function () { toggleExpand('constraints'); }}
            className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl flex-shrink-0">{'🛠️'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900">约束</span>
                {constraintFilled && <Badge variant="success">已填写</Badge>}
                {draft.constraintLength && (
                  <Badge variant="info">{LENGTH_LABEL[draft.constraintLength] || draft.constraintLength}</Badge>
                )}
                {draft.constraintTone && (
                  <Badge variant="info">{TONE_LABEL[draft.constraintTone] || draft.constraintTone}</Badge>
                )}
                {draft.constraintTiming && (
                  <Badge variant="info">{TIMING_LABEL[draft.constraintTiming] || draft.constraintTiming}</Badge>
                )}
                {draft.constraintSensitivity && (
                  <Badge variant="info">{SENSITIVITY_LABEL[draft.constraintSensitivity] || draft.constraintSensitivity}</Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                有哪些限制？比如字数、平台规则、敏感话题
              </p>
            </div>
            <span
              className={'text-gray-400 transition-transform duration-200 text-sm flex-shrink-0 ' +
                (expanded === 'constraints' ? 'rotate-90' : '')}
            >
              {'▶'}
            </span>
          </button>

          {expanded === 'constraints' && (
            <div className="px-5 pb-5 pt-0 space-y-5 border-t border-gray-100 pt-3">
              {/* 字数 */}
              <div>
                <span className="text-xs font-medium text-gray-500 mb-2 block">字数</span>
                <div className="flex gap-2 flex-wrap">
                  {CONSTRAINT_OPTIONS.length.map(function (opt) {
                    var isSel = draft.constraintLength === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        title={opt.desc}
                        onClick={function () { handleConstraintSelect('length', opt.value); }}
                        className={chipRingClass(isSel)}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 语气 */}
              <div>
                <span className="text-xs font-medium text-gray-500 mb-2 block">语气</span>
                <div className="flex gap-2 flex-wrap">
                  {CONSTRAINT_OPTIONS.tone.map(function (opt) {
                    var isSel = draft.constraintTone === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        title={opt.desc}
                        onClick={function () { handleConstraintSelect('tone', opt.value); }}
                        className={chipRingClass(isSel)}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 时效 */}
              <div>
                <span className="text-xs font-medium text-gray-500 mb-2 block">时效</span>
                <div className="flex gap-2 flex-wrap">
                  {CONSTRAINT_OPTIONS.timing.map(function (opt) {
                    var isSel = draft.constraintTiming === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        title={opt.desc}
                        onClick={function () { handleConstraintSelect('timing', opt.value); }}
                        className={chipRingClass(isSel)}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 敏感度 */}
              <div>
                <span className="text-xs font-medium text-gray-500 mb-2 block">敏感度</span>
                <div className="flex gap-2 flex-wrap">
                  {CONSTRAINT_OPTIONS.sensitivity.map(function (opt) {
                    var isSel = draft.constraintSensitivity === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        title={opt.desc}
                        onClick={function () { handleConstraintSelect('sensitivity', opt.value); }}
                        className={chipRingClass(isSel)}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom constraint note */}
              <input
                type="text"
                value={draft.constraintNote || ''}
                onChange={function (e) { handleConstraintNote(e.target.value); }}
                placeholder="其他限制..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          )}
        </Card>

        {/* ═══ CARD 5: 反馈 Feedback (multi select) ═══ */}
        <Card hover padding="none" className="overflow-hidden">
          <button
            type="button"
            onClick={function () { toggleExpand('feedback'); }}
            className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl flex-shrink-0">{'💬'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900">反馈</span>
                {feedbackFilled && <Badge variant="success">已填写</Badge>}
                {(draft.feedbacks || []).map(function (f) {
                  return (
                    <Badge key={f} variant="info">{FEEDBACK_LABEL[f] || f}</Badge>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                你希望读者看完后怎么评价？转发时会说什么？
              </p>
            </div>
            <span
              className={'text-gray-400 transition-transform duration-200 text-sm flex-shrink-0 ' +
                (expanded === 'feedback' ? 'rotate-90' : '')}
            >
              {'▶'}
            </span>
          </button>

          {expanded === 'feedback' && (
            <div className="px-5 pb-5 pt-0 space-y-4 border-t border-gray-100">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
                {FEEDBACK_OPTIONS.map(function (opt) {
                  var isSel = (draft.feedbacks || []).indexOf(opt.value) >= 0;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      title={opt.desc}
                      onClick={function () { handleFeedbackToggle(opt.value); }}
                      className={chipRingClass(isSel)}
                    >
                      <span className="mr-1">{opt.emoji}</span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={draft.feedbackNote || ''}
                onChange={function (e) { handleFeedbackNote(e.target.value); }}
                placeholder="其他期望..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          )}
        </Card>
      </div>

      {/* DBS cross-reference hint */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-500">
        <p className="font-medium text-gray-600 mb-1">
          参考 DBS 方法论
        </p>
        <p>
          <code className="bg-gray-200 px-1 rounded">dbs-goal</code>
          {' '}明确写作目标 |{' '}
          <code className="bg-gray-200 px-1 rounded">dbs-chatroom</code>
          {' '}苏格拉底式追问 |{' '}
          <code className="bg-gray-200 px-1 rounded">dbs-good-question</code>
          {' '}好问题的五个维度
        </p>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between pt-2">
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
            disabled={!hasAnyAnswer}
            onClick={handleConfirm}
          >
            确认进入下一步
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step2Guide;
