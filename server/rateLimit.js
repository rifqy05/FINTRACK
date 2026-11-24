// Pembatasan frekuensi request sederhana di memori (FR-07: batasi panjang input,
// frekuensi request, dan biaya penggunaan).
//
// Cukup untuk satu proses backend versi awal. Jika nanti berjalan di beberapa
// instance, ganti dengan penyimpanan bersama (mis. tabel/Redis) tanpa mengubah
// pemanggilnya.

export function createRateLimiter({ max, windowMs }) {
  const hits = new Map();

  function pruneExpired(now) {
    for (const [entryKey, times] of hits.entries()) {
      const fresh = times.filter((time) => now - time < windowMs);
      if (fresh.length === 0) hits.delete(entryKey);
      else if (fresh.length !== times.length) hits.set(entryKey, fresh);
    }
  }

  return {
    check(key, now = Date.now()) {
      if (hits.size > 100) pruneExpired(now);
      const active = (hits.get(key) ?? []).filter((time) => now - time < windowMs);

      if (active.length >= max) {
        const retryAfterMs = windowMs - (now - active[0]);
        hits.set(key, active);
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
        };
      }

      active.push(now);
      hits.set(key, active);
      return { allowed: true, remaining: max - active.length, retryAfterSeconds: 0 };
    },
    reset() {
      hits.clear();
    },
    trackedKeys() {
      return hits.size;
    },
  };
}
