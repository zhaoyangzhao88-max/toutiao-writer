import { describe, it, expect, beforeEach, vi } from 'vitest';
import { materialApi, writingApi, optimizeApi, exportApi } from '../../lib/api';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('request wrapper - success responses', () => {
  it('returns { success: true, data } on 200 response', async () => {
    const mockData = { content: 'test content', source: 'manual' };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockData),
    });

    const result = await materialApi.fetch({ mode: 'url', url: 'https://example.com' });
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockData);
    expect(result.error).toBeUndefined();
  });

  it('materialApi.fetch sends POST to correct endpoint', async () => {
    let capturedUrl = '';
    let capturedBody = '';
    globalThis.fetch = vi.fn().mockImplementation((url, opts) => {
      capturedUrl = url;
      capturedBody = opts.body;
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) });
    });

    await materialApi.fetch({ mode: 'url', url: 'http://example.com' });
    expect(capturedUrl).toBe('/api/material/fetch');
    const body = JSON.parse(capturedBody);
    expect(body.mode).toBe('url');
    expect(body.url).toBe('http://example.com');
  });

  it('exportApi.images builds correct query string', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ source: 'placeholder', placeholderUrls: [] }),
    });

    await exportApi.images('test keywords');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/export/images?keywords=test+keywords',
      expect.any(Object)
    );
  });

  it('articleStream returns raw Response (not wrapped in ApiResponse)', async () => {
    const mockResponse = { ok: true, body: null, headers: new Headers() };
    globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await writingApi.articleStream({ title: 'Test', material_card: {} });
    expect(result).toBe(mockResponse);
  });
});

describe('request wrapper - error handling', () => {
  it('returns { success: false, error } on 400 with detail string', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ detail: 'Invalid URL' }),
    });

    const result = await materialApi.fetch({ mode: 'url', url: '' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid URL');
  });

  it('returns { success: false, error } on 500 with object detail', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ detail: { code: 'ERR', message: 'Server error' } }),
    });

    const result = await materialApi.fetch({ mode: 'url', url: 'x' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('ERR');
  });

  it('returns { success: false, error } on non-JSON response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.resolve({ detail: 'Bad Gateway' }),
    });

    const result = await materialApi.fetch({ mode: 'url', url: 'x' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Bad Gateway');
  });

  it('returns network error when fetch throws', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    const result = await materialApi.fetch({ mode: 'url', url: 'x' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network failure');
  });

  it('returns generic error for non-Error thrown values', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue('string error');

    const result = await materialApi.fetch({ mode: 'url', url: 'x' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });
});

describe('API module signatures', () => {
  it('materialApi has fetch and extract methods', () => {
    expect(materialApi).toHaveProperty('fetch');
    expect(materialApi).toHaveProperty('extract');
    expect(typeof materialApi.fetch).toBe('function');
    expect(typeof materialApi.extract).toBe('function');
  });

  it('writingApi has deconstruct, titles, article, articleStream', () => {
    expect(writingApi).toHaveProperty('deconstruct');
    expect(writingApi).toHaveProperty('titles');
    expect(writingApi).toHaveProperty('article');
    expect(writingApi).toHaveProperty('articleStream');
  });

  it('optimizeApi has diagnose, hook, aiCheck, fix', () => {
    expect(optimizeApi).toHaveProperty('diagnose');
    expect(optimizeApi).toHaveProperty('hook');
    expect(optimizeApi).toHaveProperty('aiCheck');
    expect(optimizeApi).toHaveProperty('fix');
  });

  it('exportApi has images and docx methods', () => {
    expect(exportApi).toHaveProperty('images');
    expect(exportApi).toHaveProperty('docx');
  });
});
