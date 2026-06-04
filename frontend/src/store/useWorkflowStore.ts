import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  StepNumber,
  StepStatus,
  MaterialMode,
  FetchedContent,
  SearchResult,
  GuideAnswers,
  MaterialCard,
  DeconstructResult,
  TitleGeneration,
  PreWriteChecklist,
  EmotionMap,
  DiagnosisReport,
  UserChoice,
  HookVersion,
  AiCheckResult,
  ImageSlot,
  ExportStatus,
  ArticleStats,
  WorkflowState,
} from '../types/workflow';

interface WorkflowActions {
  setCurrentStep: (step: StepNumber) => void;
  goNext: () => void;
  goPrev: () => void;
  completeStep: (step: number) => void;
  skipStep: (step: number) => void;
  setMaterialMode: (mode: MaterialMode) => void;
  setRawInput: (input: string) => void;
  setFetchedContent: (content: FetchedContent) => void;
  setSearchResults: (results: SearchResult) => void;
  setGuideAnswers: (answers: GuideAnswers) => void;
  setMaterialCard: (card: MaterialCard) => void;
  setDeconstructResult: (result: DeconstructResult) => void;
  setTitleGeneration: (generation: TitleGeneration) => void;
  setSelectedTitle: (title: string) => void;
  setPreWriteChecklist: (checklist: PreWriteChecklist) => void;
  setArticle: (article: string) => void;
  appendArticleToken: (token: string) => void;
  setEmotionMap: (map: EmotionMap) => void;
  setDiagnosisReport: (report: DiagnosisReport) => void;
  setUserChoice: (choice: UserChoice) => void;
  setHookVersions: (versions: HookVersion[]) => void;
  setSelectedHook: (hook: string) => void;
  setAiCheckResults: (results: AiCheckResult) => void;
  applyFix: (id: number) => void;
  ignoreFix: (id: number) => void;
  setImageSlots: (slots: ImageSlot[]) => void;
  updateImageSlot: (index: number, partial: Partial<ImageSlot>) => void;
  setExportStatus: (status: ExportStatus) => void;
  setExportFilename: (filename: string) => void;
  setArticleStats: (stats: ArticleStats) => void;
  resetAll: () => void;
  resetFromStep: (step: StepNumber) => void;
}

type WorkflowStore = WorkflowState & WorkflowActions;

const EMPTY_STATE: WorkflowState = {
  currentStep: 1,
  stepStatus: {},
  materialMode: 'url',
  rawInput: '',
  fetchedContent: undefined,
  searchResults: undefined,
  guideAnswers: undefined,
  materialCard: undefined,
  deconstructResult: undefined,
  titleGeneration: undefined,
  selectedTitle: '',
  preWriteChecklist: undefined,
  article: undefined,
  emotionMap: undefined,
  diagnosisReport: undefined,
  userChoice: undefined,
  hookVersions: undefined,
  selectedHook: '',
  aiCheckResults: undefined,
  appliedFixes: [],
  imageSlots: [],
  exportStatus: 'idle',
  exportFilename: undefined,
  articleStats: undefined,
};

const initialState = EMPTY_STATE;

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set) => ({
      ...initialState,

      setCurrentStep: (step) => set({ currentStep: step }),

      goNext: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, 12) as StepNumber,
        })),

      goPrev: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1) as StepNumber,
        })),

      completeStep: (step) =>
        set((state) => ({
          stepStatus: {
            ...state.stepStatus,
            [step]: 'completed' as StepStatus,
          },
        })),

      skipStep: (step) =>
        set((state) => ({
          stepStatus: {
            ...state.stepStatus,
            [step]: 'skipped' as StepStatus,
          },
        })),

      setMaterialMode: (mode) => set({ materialMode: mode }),
      setRawInput: (input) => set({ rawInput: input }),
      setFetchedContent: (content) => set({ fetchedContent: content }),
      setSearchResults: (results) => set({ searchResults: results }),
      setGuideAnswers: (answers) => set({ guideAnswers: answers }),
      setMaterialCard: (card) => set({ materialCard: card }),
      setDeconstructResult: (result) => set({ deconstructResult: result }),
      setTitleGeneration: (generation) => set({ titleGeneration: generation }),
      setSelectedTitle: (title) => set({ selectedTitle: title }),
      setPreWriteChecklist: (checklist) => set({ preWriteChecklist: checklist }),
      setArticle: (article) => set({ article }),
      appendArticleToken: (token) =>
        set((state) => ({
          article: (state.article ?? '') + token,
        })),
      setEmotionMap: (map) => set({ emotionMap: map }),
      setDiagnosisReport: (report) => set({ diagnosisReport: report }),
      setUserChoice: (choice) => set({ userChoice: choice }),
      setHookVersions: (versions) => set({ hookVersions: versions }),
      setSelectedHook: (hook) => set({ selectedHook: hook }),
      setAiCheckResults: (results) => set({ aiCheckResults: results }),

      applyFix: (id) =>
        set((state) => ({
          appliedFixes: state.appliedFixes.includes(id)
            ? state.appliedFixes
            : [...state.appliedFixes, id],
        })),

      ignoreFix: (_id) => {
        // Ignored fixes are tracked implicitly — they are not in appliedFixes
      },

      setImageSlots: (slots) => set({ imageSlots: slots }),

      updateImageSlot: (index, partial) =>
        set((state) => ({
          imageSlots: state.imageSlots.map((slot, i) =>
            i === index ? { ...slot, ...partial } : slot
          ),
        })),

      setExportStatus: (status) => set({ exportStatus: status }),
      setExportFilename: (filename) => set({ exportFilename: filename }),
      setArticleStats: (stats) => set({ articleStats: stats }),

      resetFromStep: (step) =>
        set((state) => {
          const reset: Partial<WorkflowState> = {};
          // Step 2 intentionally preserved — user preferences, only resetAll clears it
          // Step 3+ data
          if (step <= 3) { reset.materialCard = undefined; }
          // Step 4+ data
          if (step <= 4) { reset.deconstructResult = undefined; }
          // Step 5+ data
          if (step <= 5) { reset.titleGeneration = undefined; reset.selectedTitle = ''; }
          // Step 6+ data
          if (step <= 6) { reset.preWriteChecklist = undefined; reset.article = ''; reset.emotionMap = undefined; }
          // Step 7+ data
          if (step <= 7) { reset.diagnosisReport = undefined; reset.userChoice = undefined; }
          // Step 8+ data
          if (step <= 8) { reset.hookVersions = undefined; reset.selectedHook = ''; }
          // Step 9+ data
          if (step <= 9) { reset.aiCheckResults = undefined; reset.appliedFixes = []; }
          // Step 10+ data
          if (step <= 10) { reset.imageSlots = []; }
          // Step 11+ data
          if (step <= 11) { reset.exportStatus = 'idle'; reset.exportFilename = ''; }
          // Step 12 data
          if (step <= 12) { reset.articleStats = undefined; }
          // Reset step status for steps >= step
          const newStatus = { ...state.stepStatus };
          for (var s = step; s <= 12; s++) {
            delete newStatus[s];
          }
          reset.stepStatus = newStatus;
          return reset;
        }),

      resetAll: () => set({ ...EMPTY_STATE }),
    }),
    {
      name: 'toutiao-writer-workflow',
      partialize: (state) => ({ ...state }),
    }
  )
);
