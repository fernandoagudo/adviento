const RETRYABLE_STATUS = 429;

function retryAfterMs(headers, now) {
  const value = headers?.get?.('retry-after');
  if (!value) return 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1_000);
  const date = Date.parse(value);
  return Number.isNaN(date) ? 0 : Math.max(0, date - now());
}

/**
 * Creates a sequential, rate-limited HTTP requester for Amazon Creators API.
 * It retries throttling responses only; authentication and validation errors fail fast.
 */
export function createAmazonRequest({
  fetchImpl = fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = Date.now,
  minRequestIntervalMs = 1_100,
  maxRetries = 4,
  retryBaseMs = 2_000,
} = {}) {
  let lastRequestAt = -minRequestIntervalMs;

  return async function request(url, options) {
    const waitForPacing = minRequestIntervalMs - (now() - lastRequestAt);
    if (waitForPacing > 0) await sleep(waitForPacing);

    for (let attempt = 0; ; attempt += 1) {
      lastRequestAt = now();
      const response = await fetchImpl(url, options);
      const body = await response.json().catch(() => ({}));
      if (response.ok) return body;

      if (response.status === RETRYABLE_STATUS && attempt < maxRetries) {
        const backoff = retryBaseMs * (2 ** attempt);
        await sleep(Math.max(backoff, retryAfterMs(response.headers, now)));
        continue;
      }

      throw new Error(`${response.status} ${JSON.stringify(body)}`);
    }
  };
}
