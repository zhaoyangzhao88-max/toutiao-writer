import { describe, it, expect } from 'vitest';
import type { ApiResponse, SSEMessage } from '../../types/workflow';

describe('ApiResponse type structure', () => {
  it('success response has data and no error', () => {
    const res: ApiResponse<string> = { success: true, data: 'hello' };
    expect(res.success).toBe(true);
    expect(res.data).toBe('hello');
    expect(res.error).toBeUndefined();
  });

  it('error response has error and no data', () => {
    const res: ApiResponse<never> = { success: false, error: 'Not found' };
    expect(res.success).toBe(false);
    expect(res.error).toBe('Not found');
    expect(res.data).toBeUndefined();
  });
});

describe('SSEMessage type structure', () => {
  it('token message has type and content', () => {
    const msg: SSEMessage = { type: 'token', content: 'Hello' };
    expect(msg.type).toBe('token');
    expect(msg.content).toBe('Hello');
  });

  it('error message has type and error', () => {
    const msg: SSEMessage = { type: 'error', error: 'Stream failed' };
    expect(msg.type).toBe('error');
    expect(msg.error).toBe('Stream failed');
  });

  it('done message has only type', () => {
    const msg: SSEMessage = { type: 'done' };
    expect(msg.type).toBe('done');
  });
});
