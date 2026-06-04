import { describe, it, expect } from 'vitest';
import {
  PHASES, STEP_LABELS, CONFLICT_TYPES, GENRE_OPTIONS,
  TRIGGER_LABELS, FUZZY_WORD_MAP, DISABLED_WORDS,
  IMAGE_STYLES, AUDIENCE_OPTIONS, GOAL_OPTIONS,
  CONFLICT_OPTIONS, CONSTRAINT_OPTIONS, FEEDBACK_OPTIONS,
} from '../../lib/constants';

describe('PHASES', () => {
  it('covers all 12 steps exactly once', () => {
    const covered = PHASES.flatMap((p) => p.steps).sort((a, b) => a - b);
    expect(covered).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('has unique phase names', () => {
    const names = PHASES.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('each phase has a color class starting with bg-', () => {
    PHASES.forEach((p) => {
      expect(p.color).toMatch(/^bg-/);
    });
  });

  it('has 5 phases defined', () => {
    expect(PHASES).toHaveLength(5);
  });
});

describe('STEP_LABELS', () => {
  it('has entries for all 12 steps', () => {
    for (let i = 1; i <= 12; i++) {
      expect(STEP_LABELS[i as keyof typeof STEP_LABELS]).toBeDefined();
    }
  });

  it('each step has label, phase, and description', () => {
    Object.values(STEP_LABELS).forEach((info) => {
      expect(info.label).toBeTruthy();
      expect(info.phase).toBeTruthy();
      expect(info.description).toBeTruthy();
    });
  });

  it('step 1 is 获取素材 in 分析与增补 phase', () => {
    expect(STEP_LABELS[1].label).toBe('获取素材');
    expect(STEP_LABELS[1].phase).toBe('分析与增补');
  });

  it('step 6 is 正文写作 in 写作 phase', () => {
    expect(STEP_LABELS[6].label).toBe('正文写作');
    expect(STEP_LABELS[6].phase).toBe('写作');
  });

  it('step 7 is 五维诊断 in 暂停诊断 phase', () => {
    expect(STEP_LABELS[7].label).toBe('五维诊断');
    expect(STEP_LABELS[7].phase).toBe('暂停诊断');
  });

  it('step 12 is 展示发布 in 交付 phase', () => {
    expect(STEP_LABELS[12].label).toBe('展示发布');
    expect(STEP_LABELS[12].phase).toBe('交付');
  });
});

describe('TRIGGER_LABELS', () => {
  it('has entries for all 8 trigger types', () => {
    expect(Object.keys(TRIGGER_LABELS)).toHaveLength(8);
  });

  it('all labels are non-empty', () => {
    Object.values(TRIGGER_LABELS).forEach((label) => {
      expect(label.length).toBeGreaterThan(0);
    });
  });
});

describe('CONFLICT_TYPES', () => {
  it('has 5 conflict types', () => {
    expect(CONFLICT_TYPES).toHaveLength(5);
  });

  it('each conflict has value and label', () => {
    CONFLICT_TYPES.forEach((c) => {
      expect(c).toHaveProperty('value');
      expect(c).toHaveProperty('label');
    });
  });
});

describe('GENRE_OPTIONS', () => {
  it('has 4 genre options', () => {
    expect(GENRE_OPTIONS).toHaveLength(4);
  });
});

describe('FUZZY_WORD_MAP', () => {
  it('has entries defined', () => {
    expect(Object.keys(FUZZY_WORD_MAP).length).toBeGreaterThan(0);
  });

  it('each replacement is a non-empty string', () => {
    Object.values(FUZZY_WORD_MAP).forEach((replacement) => {
      expect(replacement.length).toBeGreaterThan(0);
    });
  });
});

describe('DISABLED_WORDS', () => {
  it('has entries defined', () => {
    expect(DISABLED_WORDS.length).toBeGreaterThan(0);
  });
});

describe('CONSTRAINT_OPTIONS', () => {
  it('has length, tone, timing, and sensitivity dimensions', () => {
    expect(CONSTRAINT_OPTIONS).toHaveProperty('length');
    expect(CONSTRAINT_OPTIONS).toHaveProperty('tone');
    expect(CONSTRAINT_OPTIONS).toHaveProperty('timing');
    expect(CONSTRAINT_OPTIONS).toHaveProperty('sensitivity');
  });

  it('every option has value, label, and desc', () => {
    Object.values(CONSTRAINT_OPTIONS).forEach((dimension) => {
      dimension.forEach((opt) => {
        expect(opt).toHaveProperty('value');
        expect(opt).toHaveProperty('label');
        expect(opt).toHaveProperty('desc');
      });
    });
  });

  it('length has 3 options', () => {
    expect(CONSTRAINT_OPTIONS.length).toHaveLength(3);
  });

  it('tone has 4 options', () => {
    expect(CONSTRAINT_OPTIONS.tone).toHaveLength(4);
  });
});

describe('IMAGE_STYLES', () => {
  it('all styles have value, label, and emoji', () => {
    IMAGE_STYLES.forEach((s) => {
      expect(s).toHaveProperty('value');
      expect(s).toHaveProperty('label');
      expect(s).toHaveProperty('emoji');
    });
  });
});

describe('AUDIENCE_OPTIONS', () => {
  it('all options have value, label, desc, emoji', () => {
    AUDIENCE_OPTIONS.forEach((a) => {
      expect(a).toHaveProperty('value');
      expect(a).toHaveProperty('label');
      expect(a).toHaveProperty('desc');
      expect(a).toHaveProperty('emoji');
    });
  });
});

describe('GOAL_OPTIONS', () => {
  it('all options have value, label, desc, emoji', () => {
    GOAL_OPTIONS.forEach((g) => {
      expect(g).toHaveProperty('value');
      expect(g).toHaveProperty('label');
      expect(g).toHaveProperty('desc');
      expect(g).toHaveProperty('emoji');
    });
  });
});

describe('FEEDBACK_OPTIONS', () => {
  it('all options have value, label, desc, emoji', () => {
    FEEDBACK_OPTIONS.forEach((f) => {
      expect(f).toHaveProperty('value');
      expect(f).toHaveProperty('label');
      expect(f).toHaveProperty('desc');
      expect(f).toHaveProperty('emoji');
    });
  });
});
