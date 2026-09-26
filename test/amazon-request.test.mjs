import assert from 'node:assert/strict';
import test from 'node:test';
import { createAmazonRequest } from '../scripts/amazon-request.mjs';

function response(status, body, retryAfter = null) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => name === 'retry-after' ? retryAfter : null },
    json: async () => body,
  };
}

test('retries a throttled request with exponential backoff', async () => {
  const waits = [], responses = [response(429, { type: 'ThrottleException' }), response(200, { ok: true })];
  const request = createAmazonRequest({ fetchImpl: async () => responses.shift(), sleep: async (ms) => waits.push(ms), minRequestIntervalMs: 0, retryBaseMs: 100 });
  assert.deepEqual(await request('https://example.test', {}), { ok: true });
  assert.deepEqual(waits, [100]);
});

test('honours Retry-After when it is longer than backoff', async () => {
  const waits = [], responses = [response(429, {}, '3'), response(200, { ok: true })];
  const request = createAmazonRequest({ fetchImpl: async () => responses.shift(), sleep: async (ms) => waits.push(ms), minRequestIntervalMs: 0, retryBaseMs: 100 });
  await request('https://example.test', {});
  assert.deepEqual(waits, [3_000]);
});

test('does not retry a non-throttling API error', async () => {
  let calls = 0;
  const request = createAmazonRequest({ fetchImpl: async () => { calls += 1; return response(401, { message: 'invalid token' }); }, minRequestIntervalMs: 0 });
  await assert.rejects(() => request('https://example.test', {}), /401/);
  assert.equal(calls, 1);
});
