import type { ApiResponse } from '../types/workflow';

const BASE = '/api';

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(BASE + url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    const json = await res.json();
    if (!res.ok) {
      const errMsg = typeof json.detail === 'string'
        ? json.detail
        : JSON.stringify(json.detail || `HTTP ${res.status}`);
      return { success: false, error: errMsg };
    }
    return { success: true, data: json as T };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { success: false, error: message };
  }
}

export const materialApi = {
  fetch: (
    data: { mode: string; url?: string; text?: string; topic?: string }
  ) =>
    request('/material/fetch', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  extract: (data: { raw_material: string; guide_answers?: Record<string, string> }) =>
    request('/material/extract', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const writingApi = {
  deconstruct: (data: { material_card: unknown }) =>
    request('/writing/deconstruct', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  titles: (data: { material_card: unknown; deconstruct_result?: unknown }) =>
    request('/writing/titles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  article: (data: { title: string; material_card: unknown; deconstruct_result?: unknown; word_count?: number }) =>
    request('/writing/article', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  articleStream: (data: {
    title: string;
    material_card: unknown;
    deconstruct_result?: unknown;
    word_count?: number;
  }): Promise<Response> =>
    fetch(BASE + '/writing/article/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
};

export const optimizeApi = {
  diagnose: (data: { article: string; title: string }) =>
    request('/optimize/diagnose', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  hook: (data: { article: string }) =>
    request('/optimize/hook', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  aiCheck: (data: { article: string }) =>
    request('/optimize/ai-check', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  fix: (data: { article: string; title: string; diagnosis: unknown; cycle: number }) =>
    request('/optimize/fix', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const exportApi = {
  images: (keywords: string) => {
    const params = new URLSearchParams({ keywords });
    return request('/export/images?' + params.toString());
  },

  docx: (data: {
    title: string;
    article: string;
    images?: string[];
  }) =>
    request('/export/docx', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
