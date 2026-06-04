import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkflowStore } from '../../store/useWorkflowStore';

beforeEach(() => {
  localStorage.clear();
  useWorkflowStore.setState(useWorkflowStore.getInitialState());
});

// ==================== Navigation ====================

describe('Navigation', () => {
  it('starts at step 1', () => {
    const { currentStep } = useWorkflowStore.getState();
    expect(currentStep).toBe(1);
  });

  it('goNext increments currentStep by 1', () => {
    useWorkflowStore.getState().goNext();
    expect(useWorkflowStore.getState().currentStep).toBe(2);
  });

  it('goNext clamps at step 12', () => {
    useWorkflowStore.setState({ currentStep: 12 });
    useWorkflowStore.getState().goNext();
    expect(useWorkflowStore.getState().currentStep).toBe(12);
  });

  it('goPrev decrements currentStep by 1', () => {
    useWorkflowStore.setState({ currentStep: 5 });
    useWorkflowStore.getState().goPrev();
    expect(useWorkflowStore.getState().currentStep).toBe(4);
  });

  it('goPrev clamps at step 1', () => {
    useWorkflowStore.setState({ currentStep: 1 });
    useWorkflowStore.getState().goPrev();
    expect(useWorkflowStore.getState().currentStep).toBe(1);
  });

  it('setCurrentStep sets the step directly', () => {
    useWorkflowStore.getState().setCurrentStep(7);
    expect(useWorkflowStore.getState().currentStep).toBe(7);
  });
});

// ==================== Step Status ====================

describe('Step Status', () => {
  it('completeStep marks a step as completed', () => {
    useWorkflowStore.getState().completeStep(3);
    const { stepStatus } = useWorkflowStore.getState();
    expect(stepStatus[3]).toBe('completed');
  });

  it('completeStep does not affect other steps', () => {
    useWorkflowStore.getState().completeStep(5);
    const { stepStatus } = useWorkflowStore.getState();
    expect(stepStatus[5]).toBe('completed');
    expect(stepStatus[4]).toBeUndefined();
  });

  it('skipStep marks a step as skipped', () => {
    useWorkflowStore.getState().skipStep(2);
    const { stepStatus } = useWorkflowStore.getState();
    expect(stepStatus[2]).toBe('skipped');
  });

  it('multiple steps can have different statuses', () => {
    useWorkflowStore.getState().completeStep(1);
    useWorkflowStore.getState().skipStep(2);
    useWorkflowStore.getState().completeStep(3);
    const { stepStatus } = useWorkflowStore.getState();
    expect(stepStatus[1]).toBe('completed');
    expect(stepStatus[2]).toBe('skipped');
    expect(stepStatus[3]).toBe('completed');
  });
});

// ==================== resetFromStep ====================

describe('resetFromStep', () => {
  it('preserves step 2 data when resetting from step 3', () => {
    useWorkflowStore.setState({
      guideAnswers: { audience: 'office_worker' },
      materialCard: { coreTopic: 'test', keyData: [], cases: [], controversies: [], goldenQuote: '' },
      deconstructResult: { fuzzyTerms: [], replacements: [], genre: 'business' },
    });

    useWorkflowStore.getState().resetFromStep(3);

    const state = useWorkflowStore.getState();
    expect(state.guideAnswers).toEqual({ audience: 'office_worker' });
    expect(state.materialCard).toBeUndefined();
    expect(state.deconstructResult).toBeUndefined();
  });

  it('clears downstream step 5 data but keeps step 3 and 4 when resetting from step 5', () => {
    useWorkflowStore.setState({
      materialCard: { coreTopic: 't', keyData: [], cases: [], controversies: [], goldenQuote: '' },
      deconstructResult: { fuzzyTerms: [], replacements: [], genre: 'business' },
      titleGeneration: { titles: [], triggerCoverage: [] },
      selectedTitle: 'Test Title',
    });

    useWorkflowStore.getState().resetFromStep(5);

    const state = useWorkflowStore.getState();
    expect(state.materialCard).toBeDefined();
    expect(state.deconstructResult).toBeDefined();
    expect(state.titleGeneration).toBeUndefined();
    expect(state.selectedTitle).toBe('');
  });

  it('clears step statuses from the reset point onward', () => {
    useWorkflowStore.setState({
      stepStatus: { 1: 'completed', 2: 'completed', 3: 'completed', 4: 'active' },
    });

    useWorkflowStore.getState().resetFromStep(3);

    const { stepStatus } = useWorkflowStore.getState();
    expect(stepStatus[1]).toBe('completed');
    expect(stepStatus[2]).toBe('completed');
    expect(stepStatus[3]).toBeUndefined();
    expect(stepStatus[4]).toBeUndefined();
  });

  it('resets exportStatus to idle and clears exportFilename when resetting from step 11', () => {
    useWorkflowStore.setState({ exportStatus: 'done', exportFilename: 'test.docx' });
    useWorkflowStore.getState().resetFromStep(11);
    const state = useWorkflowStore.getState();
    expect(state.exportStatus).toBe('idle');
    expect(state.exportFilename).toBe('');
  });

  it('resets imageSlots to empty array when resetting from step 10', () => {
    useWorkflowStore.setState({
      imageSlots: [{ index: 0, topic: 'test', keywords: 'test', style: 'humanistic' }],
    });
    useWorkflowStore.getState().resetFromStep(10);
    expect(useWorkflowStore.getState().imageSlots).toEqual([]);
  });

  it('clears article and emotionMap when resetting from step 6', () => {
    useWorkflowStore.setState({
      article: 'Some article text',
      emotionMap: { opening: 'happy', mid1: 'sad', mid2: 'angry', climax: 'excited', ending: 'calm' },
    });
    useWorkflowStore.getState().resetFromStep(6);
    const state = useWorkflowStore.getState();
    expect(state.article).toBe('');
    expect(state.emotionMap).toBeUndefined();
  });

  it('clears diagnosis and userChoice when resetting from step 7', () => {
    useWorkflowStore.setState({
      diagnosisReport: {
        dimensions: [{ name: 'info', verdict: 'pass', issues: [], suggestion: 'ok' }],
        firstAction: { action: 'none', reason: 'all good' },
      },
      userChoice: 'skip',
    });
    useWorkflowStore.getState().resetFromStep(7);
    const state = useWorkflowStore.getState();
    expect(state.diagnosisReport).toBeUndefined();
    expect(state.userChoice).toBeUndefined();
  });

  it('clears aiCheckResults and appliedFixes when resetting from step 9', () => {
    useWorkflowStore.setState({
      aiCheckResults: { signals: [], strongCount: 0, mediumCount: 0, weakCount: 0 },
      appliedFixes: [1, 2, 3],
    });
    useWorkflowStore.getState().resetFromStep(9);
    const state = useWorkflowStore.getState();
    expect(state.aiCheckResults).toBeUndefined();
    expect(state.appliedFixes).toEqual([]);
  });
});

// ==================== applyFix ====================

describe('applyFix', () => {
  it('adds a fix ID to appliedFixes', () => {
    useWorkflowStore.getState().applyFix(3);
    expect(useWorkflowStore.getState().appliedFixes).toContain(3);
  });

  it('is idempotent — applying the same fix twice does not duplicate', () => {
    useWorkflowStore.setState({ appliedFixes: [1, 2, 3] });
    useWorkflowStore.getState().applyFix(3);
    expect(useWorkflowStore.getState().appliedFixes).toEqual([1, 2, 3]);
  });

  it('appends multiple fix IDs in order', () => {
    useWorkflowStore.getState().applyFix(1);
    useWorkflowStore.getState().applyFix(5);
    useWorkflowStore.getState().applyFix(3);
    expect(useWorkflowStore.getState().appliedFixes).toEqual([1, 5, 3]);
  });
});

// ==================== appendArticleToken ====================

describe('appendArticleToken', () => {
  it('appends a token to an empty article', () => {
    useWorkflowStore.getState().appendArticleToken('Hello');
    expect(useWorkflowStore.getState().article).toBe('Hello');
  });

  it('appends consecutive tokens to build the full article', () => {
    useWorkflowStore.getState().appendArticleToken('今天');
    useWorkflowStore.getState().appendArticleToken('天气');
    useWorkflowStore.getState().appendArticleToken('真好');
    expect(useWorkflowStore.getState().article).toBe('今天天气真好');
  });

  it('works when article is initially undefined', () => {
    useWorkflowStore.setState({ article: undefined });
    useWorkflowStore.getState().appendArticleToken('Hello');
    expect(useWorkflowStore.getState().article).toBe('Hello');
  });
});

// ==================== resetAll ====================

describe('resetAll', () => {
  it('resets to initial EMPTY_STATE', () => {
    useWorkflowStore.setState({
      currentStep: 7,
      stepStatus: { 1: 'completed', 2: 'completed' },
      materialMode: 'topic',
      rawInput: 'some input',
      article: 'A long article...',
      exportStatus: 'done',
    });

    useWorkflowStore.getState().resetAll();

    const state = useWorkflowStore.getState();
    expect(state.currentStep).toBe(1);
    expect(state.stepStatus).toEqual({});
    expect(state.materialMode).toBe('url');
    expect(state.rawInput).toBe('');
    expect(state.article).toBeUndefined();
    expect(state.exportStatus).toBe('idle');
    expect(state.appliedFixes).toEqual([]);
    expect(state.imageSlots).toEqual([]);
  });
});

// ==================== Setter Actions ====================

describe('Setter actions', () => {
  it('setMaterialMode updates the mode', () => {
    useWorkflowStore.getState().setMaterialMode('topic');
    expect(useWorkflowStore.getState().materialMode).toBe('topic');
  });

  it('setRawInput updates raw input', () => {
    useWorkflowStore.getState().setRawInput('my draft text');
    expect(useWorkflowStore.getState().rawInput).toBe('my draft text');
  });

  it('setFetchedContent stores the fetched content', () => {
    const content = { content: 'page content', source: 'manual' as const };
    useWorkflowStore.getState().setFetchedContent(content);
    expect(useWorkflowStore.getState().fetchedContent).toEqual(content);
  });

  it('setSearchResults stores search results', () => {
    const results = { query: 'test', results: [{ title: 'Result 1', url: 'https://example.com', snippet: '...' }], searchSource: 'webfetch' as const };
    useWorkflowStore.getState().setSearchResults(results);
    expect(useWorkflowStore.getState().searchResults).toEqual(results);
  });

  it('updateImageSlot updates a specific slot by index', () => {
    const slots = [
      { index: 0, topic: 'a', keywords: 'a', style: 'humanistic' as const },
      { index: 1, topic: 'b', keywords: 'b', style: 'artistic' as const },
    ];
    useWorkflowStore.setState({ imageSlots: slots });
    useWorkflowStore.getState().updateImageSlot(1, { url: 'https://example.com/img.jpg' });
    const updated = useWorkflowStore.getState().imageSlots;
    expect(updated[0].url).toBeUndefined();
    expect(updated[1].url).toBe('https://example.com/img.jpg');
  });

  it('setGuideAnswers stores guide answers', () => {
    const answers = { audience: 'office_worker', goals: ['forward', 'learn'] };
    useWorkflowStore.getState().setGuideAnswers(answers);
    expect(useWorkflowStore.getState().guideAnswers).toEqual(answers);
  });

  it('setExportStatus updates export status', () => {
    useWorkflowStore.getState().setExportStatus('generating');
    expect(useWorkflowStore.getState().exportStatus).toBe('generating');
    useWorkflowStore.getState().setExportStatus('done');
    expect(useWorkflowStore.getState().exportStatus).toBe('done');
  });
});
