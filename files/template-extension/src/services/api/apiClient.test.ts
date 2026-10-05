import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, createApiClient } from './apiClient';

describe('createApiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends JSON requests to the base URL and returns the parsed body', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(Response.json({ ok: true })));
    vi.stubGlobal('fetch', fetchMock);

    const client = createApiClient({ baseUrl: 'https://api.example.com' });
    await expect(client.request<{ ok: boolean }>('/status')).resolves.toEqual({ ok: true });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.example.com/status');
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json');
  });

  it('throws an ApiError with the status of a failed response', async () => {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response(null, { status: 503 })));

    const request = createApiClient().request('/status');
    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({ status: 503 });
  });
});
