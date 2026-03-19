import type { StatusResponse } from '../shared/types.ts';

export const STATUS_POLL_INTERVAL_MS = 300_000;

export function buildStaticStatusUrl(baseUrl: string, cacheBustValue: number) {
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const url = new URL('status.json', `https://example.com${normalizedBaseUrl}`);
  url.searchParams.set('ts', String(cacheBustValue));
  return `${url.pathname}${url.search}`;
}

export async function fetchStatusResponse(
  fetchImpl: typeof fetch,
  baseUrl: string,
  cacheBustValue: number = Date.now(),
): Promise<StatusResponse> {
  const endpoints = [
    buildStaticStatusUrl(baseUrl, cacheBustValue),
    '/api/status',
  ] as const;
  let lastError: unknown = new Error('status data fetch failed');

  for (const endpoint of endpoints) {
    try {
      const response = await fetchImpl(endpoint, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`status ${response.status}`);
      }

      return (await response.json()) as StatusResponse;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}
