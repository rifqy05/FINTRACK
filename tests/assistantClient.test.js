import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Sesi pengguna disimulasikan supaya klien bisa diuji tanpa jaringan nyata.
vi.mock("../src/services/authService.js", () => ({
  getSession: vi.fn(async () => ({ access_token: "token-uji" })),
}));

import {
  ASSISTANT_API_URL,
  MAX_QUESTION_LENGTH,
  askAssistant,
  checkAssistantHealth,
  clearAiConsent,
  hasAiConsent,
  saveAiConsent,
} from "../src/services/assistantService.js";

function fakeLocalStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    size: () => store.size,
  };
}

let originalFetch;
let originalWindow;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  originalWindow = globalThis.window;
  globalThis.window = { localStorage: fakeLocalStorage() };
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.window = originalWindow;
});

describe("persetujuan pengiriman data ke penyedia AI", () => {
  it("bawaan belum disetujui, bisa disetujui, dan bisa dihentikan", () => {
    expect(hasAiConsent()).toBe(false);

    expect(saveAiConsent()).toBe(true);
    expect(hasAiConsent()).toBe(true);

    expect(clearAiConsent()).toBe(true);
    expect(hasAiConsent()).toBe(false);
  });

  it("tidak error saat localStorage tidak tersedia", () => {
    globalThis.window = {};
    expect(hasAiConsent()).toBe(false);
    expect(saveAiConsent()).toBe(false);
    expect(clearAiConsent()).toBe(false);
  });
});

describe("askAssistant: validasi di sisi klien", () => {
  it("menolak pertanyaan kosong tanpa memanggil jaringan", async () => {
    globalThis.fetch = vi.fn();
    const result = await askAssistant("   ");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("tidak boleh kosong");
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("menolak pertanyaan yang melebihi batas karakter", async () => {
    globalThis.fetch = vi.fn();
    const result = await askAssistant("a".repeat(MAX_QUESTION_LENGTH + 1));
    expect(result.ok).toBe(false);
    expect(result.error).toContain(String(MAX_QUESTION_LENGTH));
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe("askAssistant: pemanggilan backend", () => {
  it("mengirim pertanyaan beserta token sesi dan mengembalikan jawaban", async () => {
    const calls = [];
    globalThis.fetch = vi.fn(async (url, options) => {
      calls.push({ url: String(url), options });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ok: true,
          source: "ai",
          answer: "Pengeluaran terbesar adalah Makanan.",
          period: { month: "2026-10", label: "Oktober 2026", transactionCount: 12, truncated: false },
        }),
      };
    });

    const result = await askAssistant("  kategori terbesar?  ", "2026-10");

    expect(result.ok).toBe(true);
    expect(result.answer).toContain("Makanan");
    expect(result.source).toBe("ai");
    expect(result.period.label).toBe("Oktober 2026");

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`${ASSISTANT_API_URL}/api/assistant/ask`);
    expect(calls[0].options.headers.Authorization).toBe("Bearer token-uji");
    expect(JSON.parse(calls[0].options.body)).toEqual({ question: "kategori terbesar?", month: "2026-10" });
  });

  it("meneruskan pesan error dari server apa adanya", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 429,
      json: async () => ({
        ok: false,
        error: "Terlalu banyak permintaan. Coba lagi dalam 30 detik.",
        retryAfterSeconds: 30,
      }),
    }));

    const result = await askAssistant("berapa pengeluaran saya?");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Terlalu banyak permintaan");
    expect(result.retryAfterSeconds).toBe(30);
  });

  it("memberi pesan yang jelas saat backend tidak bisa dihubungi", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    });

    const result = await askAssistant("berapa pengeluaran saya?");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("npm run server");
    expect(result.error).toContain(ASSISTANT_API_URL);
  });

  it("menangani respons server yang bukan JSON", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error("bukan json");
      },
    }));

    const result = await askAssistant("berapa pengeluaran saya?");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("502");
  });
});

describe("checkAssistantHealth", () => {
  it("melaporkan status penyedia AI dari backend", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, penyediaAi: "aktif", supabase: "aktif" }),
    }));

    const result = await checkAssistantHealth();
    expect(result).toEqual({ ok: true, aiConfigured: true, supabase: "aktif" });
  });

  it("melaporkan backend yang tidak dapat dihubungi", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("offline");
    });

    const result = await checkAssistantHealth();
    expect(result.ok).toBe(false);
    expect(result.error).toContain("tidak dapat dihubungi");
  });
});
