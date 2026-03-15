// Simple in-memory idempotency/replay store for messageId + optional nonce.
// Not durable — replace with persistent store (Redis, DB) in production.

const store = new Map(); // key -> expiresAt (ms)

function _cleanup() {
  const now = Date.now();
  for (const [k, exp] of store.entries()) {
    if (exp <= now) store.delete(k);
  }
}

function checkAndStore({ messageId, nonce, timestamp, ttlMs = 5 * 60 * 1000 }) {
  _cleanup();
  if (!messageId) return { ok: false, reason: 'missing_messageId' };

  const key = nonce ? `${messageId}::${nonce}` : messageId;
  if (store.has(key)) return { ok: false, reason: 'replay_detected' };

  const msgTime = timestamp ? Date.parse(timestamp) : NaN;
  const now = Date.now();
  if (isNaN(msgTime)) return { ok: false, reason: 'invalid_timestamp' };
  const skew = 2 * 60 * 1000;
  if (msgTime > now + skew) return { ok: false, reason: 'timestamp_in_future' };
  if (now - msgTime > ttlMs + skew) return { ok: false, reason: 'timestamp_too_old' };

  store.set(key, now + ttlMs);
  return { ok: true };
}

function clearStore() {
  store.clear();
}

module.exports = {
  checkAndStore,
  clearStore
};
