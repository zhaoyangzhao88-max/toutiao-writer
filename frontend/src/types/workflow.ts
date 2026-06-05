// Step identifiers
export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type StepStatus = 'pending' | 'active' | 'completed' | 'skipped';

export const STEP_LABELS: Record<StepNumber, { label: string; phase: string }> = {
  1:  { label: '获取素材',   phase: '分析与增补' },
  2:  { label: '好问题引导', phase: '分析与增补' },
  3:  { label: '素材提炼',   phase: '分析与增补' },
  4:  { label: '概念拆解',   phase: '写作' },
  5:  { label: '生成标题',   phase: '写作' },
  6:  { label: '正文写作',   phase: '写作' },
  7:  { label: '五维诊断',   phase: '暂停诊断' },
  8:  { label: '开头优化',   phase: '优化' },
  9:  { label: 'AI 检测',    phase: '优化' },
  10: { label: '配图',       phase: '交付' },
  11: { label: '生成文档',   phase: '交付' },
  12: { label: '展示发布',   phase: '交付' },
};

// Step 1 types
export type MaterialMode = 'url' | 'draft' | 'topic';
export interface FetchedContent {
  url?: string;
  title?: string;
  content: string;
  source: 'firecrawl' | 'tavily' | 'webfetch' | 'manual';
  fetchedAt?: string;
}
export interface SearchResult {
  query: string;
  results: Array<{ title: string; url: string; snippet: string }>;
  searchSource: 'firecrawl' | 'tavily' | 'webfetch' | 'ai';
  warning?: string;
}

// Step 2
export interface GuideAnswers {
  audience?: string;              // AUDIENCE_OPTIONS value
  audienceNote?: string;          // custom text
  goals?: string[];               // GOAL_OPTIONS values (multi-select)
  goalsNote?: string;             // custom text
  conflict?: string;              // conflict description text
  conflictType?: 'data' | 'expectation' | 'behavior' | 'resource' | 'viewpoint';
  constraintLength?: string;      // CONSTRAINT_OPTIONS.length value
  constraintTone?: string;        // CONSTRAINT_OPTIONS.tone value
  constraintTiming?: string;      // CONSTRAINT_OPTIONS.timing value
  constraintSensitivity?: string; // CONSTRAINT_OPTIONS.sensitivity value
  constraintNote?: string;        // custom text
  feedbacks?: string[];           // FEEDBACK_OPTIONS values (multi-select)
  feedbackNote?: string;          // custom text
}

// Step 3
export interface MaterialCard {
  coreTopic: string;
  keyData: string[];
  cases: string[];
  controversies: string[];
  goldenQuote: string;
}

// Step 4
export interface FuzzyTerm {
  term: string;
  replacement: string;
  reason: string;
}
export interface ConcreteSuggestion {
  abstract: string;
  concrete: string;
  source: string;
  why: string;
}
export type GenreType = 'business' | 'society' | 'people' | 'life';
export interface DeconstructResult {
  fuzzyTerms: FuzzyTerm[];
  concreteSuggestions?: ConcreteSuggestion[];
  replacements: Array<{ original: string; replacement: string }>;
  genre: GenreType;
  note?: string;
}

// Step 5
export type TriggerType =
  | '认知冲突'
  | '好奇缺口'
  | '恐惧损失'
  | '争议挑衅'
  | '社会证明'
  | '结果承诺'
  | '身份代入'
  | '数字锚定';
export interface TitleCard {
  text: string;
  trigger: TriggerType;
  drivingForce: string;
  recommended: boolean;
}
export interface TitleGeneration {
  titles: TitleCard[];
  triggerCoverage: TriggerType[];
}

// Step 6
export interface PreWriteChecklist {
  wordHygiene: boolean;
  titleQuality: boolean;
  expressionEfficiency: boolean;
  cognitiveGap: boolean;
  aiAssistance: boolean;
}
export interface EmotionMap {
  opening: string;
  mid1: string;
  mid2: string;
  climax: string;
  ending: string;
}

// Step 7
export type DiagnosisVerdict = 'pass' | 'warn' | 'fail';
export interface DimensionResult {
  name: string;
  verdict: DiagnosisVerdict;
  issues: string[];
  suggestion: string;
}
export interface DiagnosisReport {
  dimensions: DimensionResult[];
  firstAction: { action: string; reason: string };
}
export type UserChoice = 'fix-one' | 'fix-all' | 'skip';

// Step 8
export type HookMethod = 'data_impact' | 'suspense' | 'scene_immersion';
export interface HookVersion {
  method: HookMethod;
  label: string;
  text: string;
  recommended: boolean;
  sixChecks: {
    independence: boolean;
    hook: boolean;
    suspense: boolean;
    credibility: boolean;
    oralFriendly: boolean;
    matching: boolean;
  };
}

// Step 9
export type SignalLevel = 'strong' | 'medium' | 'weak';
export interface AiSignal {
  id: number;
  feature: string;
  level: SignalLevel;
  description: string;
  location: string;
  suggestion: string;
}
export interface AiCheckResult {
  signals: AiSignal[];
  strongCount: number;
  mediumCount: number;
  weakCount: number;
}

// Step 10
export interface ImageSlot {
  index: number;
  topic: string;
  keywords: string;
  style: 'humanistic' | 'sports' | 'artistic' | 'social' | 'nature';
  url?: string;
  unsplashUrl?: string;
}

// Step 11
export type ExportStatus = 'idle' | 'generating' | 'done' | 'error';

// Step 12
export interface ArticleStats {
  wordCount: number;
  paragraphCount: number;
  estimatedReadTime: number;
}

// Full state
export interface WorkflowState {
  currentStep: StepNumber;
  stepStatus: Record<number, StepStatus>;
  materialMode: MaterialMode;
  rawInput: string;
  fetchedContent?: FetchedContent;
  searchResults?: SearchResult;
  guideAnswers?: GuideAnswers;
  materialCard?: MaterialCard;
  deconstructResult?: DeconstructResult;
  titleGeneration?: TitleGeneration;
  selectedTitle?: string;
  preWriteChecklist?: PreWriteChecklist;
  article?: string;
  emotionMap?: EmotionMap;
  diagnosisReport?: DiagnosisReport;
  userChoice?: UserChoice;
  hookVersions?: HookVersion[];
  selectedHook?: string;
  aiCheckResults?: AiCheckResult;
  appliedFixes: number[];
  imageSlots: ImageSlot[];
  exportStatus: ExportStatus;
  exportFilename?: string;
  articleStats?: ArticleStats;
}

// API types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface SSEMessage {
  type: 'token' | 'done' | 'error';
  content?: string;
  error?: string;
}
