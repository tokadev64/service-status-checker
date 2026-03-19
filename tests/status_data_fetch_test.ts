import { assertEquals, assertRejects } from '@std/assert';
import {
  buildStaticStatusUrl,
  fetchStatusResponse,
} from '../src/composables/status-data-fetch.ts';
import type { StatusResponse } from '../src/shared/types.ts';

Deno.test('buildStaticStatusUrl respects Vite base URL', () => {
  assertEquals(
    buildStaticStatusUrl('/service-status-checker/', 123),
    '/service-status-checker/status.json?ts=123',
  );
  assertEquals(buildStaticStatusUrl('/', 456), '/status.json?ts=456');
});

Deno.test('fetchStatusResponse falls back to local API when static JSON is unavailable', async () => {
  const payload: StatusResponse = {
    checkedAt: '2026-03-19T00:00:00.000Z',
    checkedAtLabel: '2026-03-19 09:00 JST',
    services: [],
  };
  const calls: string[] = [];

  const fetchImpl = async (input: RequestInfo | URL): Promise<Response> => {
    const url = String(input);
    calls.push(url);

    if (url.startsWith('/service-status-checker/status.json?ts=')) {
      return new Response('missing', { status: 404 });
    }

    if (url === '/api/status') {
      return Response.json(payload);
    }

    throw new Error(`unexpected url: ${url}`);
  };

  const result = await fetchStatusResponse(
    fetchImpl as typeof fetch,
    '/service-status-checker/',
    789,
  );

  assertEquals(result, payload);
  assertEquals(calls, [
    '/service-status-checker/status.json?ts=789',
    '/api/status',
  ]);
});

Deno.test('fetchStatusResponse throws when both static JSON and API fail', async () => {
  const fetchImpl = async (): Promise<Response> => {
    throw new Error('network down');
  };

  await assertRejects(
    () => fetchStatusResponse(fetchImpl as typeof fetch, '/', 100),
    Error,
    'network down',
  );
});
