import { describe, expect, it } from "vitest";
import { handleAssistantAsk, parseMonthRequest, validateQuestion } from "../server/assistant.js";
import { readServerEnv } from "../server/env.js";
import { createRateLimiter } from "../server/rateLimit.js";

// Data dummy, tanpa data keuangan nyata.
const NOW = new Date(2026, 9, 12); // 12 Oktober 2026

const CONFIG = readServerEnv({
  SUPABASE_URL: "https://contoh.supabase.co",
  SUPABASE_ANON_KEY: "anon-key-publik",
  AI_PROVIDER_API_KEY: "kunci-rahasia-server",
  AI_MODEL: "model-contoh",
});

const CONFIG_TANPA_AI = readServerEnv({
  SUPABASE_URL: "https://contoh.supabase.co",
  SUPABASE_ANON_KEY: "anon-key-publik",
});

const USER = { id: "user-a", email: "a@contoh.test" };

// Baris database sengaja menyertakan description untuk membuktikan kolom itu
// tidak pernah ikut ke ringkasan yang dikirim ke penyedia AI.
const DB_TRANSACTIONS = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    type: "income",
    category: "Gaji",
    amount: 8_000_000,
    date: "2026-10-01",
    description: "RAHASIA-GAJI",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    type: "expense",
    category: "Makanan",
    amount: 1_200_000,
    date: "2026-10-05",
    description: "RAHASIA-MAKAN",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    type: "expense",
    category: "Makanan",
    amount: 900_000,
    date: "2026-09-20",
    description: "RAHASIA-LAMA",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    type: "income",
    category: "Gaji",
    amount: 8_000_000,
    date: "2026-09-02",
    description: "RAHASIA-LAMA-2",
  },
];

const DB_BUDGETS = [
  { id: "44444444-4444-4444-8444-444444444444", month: "2026-10", category: "Makanan", limit_amount: 1_500_000 },
];

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function makeFetch({
  transactions = DB_TRANSACTIONS,
  budgets = DB_BUDGETS,
  userStatus = 200,
  dataStatus = 200,
  aiStatus = 200,
  aiAnswer = "Jawaban dari model.",
} = {}) {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    const target = String(url);
    calls.push({ url: target, options });

    if (target.includes("/auth/v1/user")) {
      return userStatus === 200 ? jsonResponse(200, USER) : jsonResponse(userStatus, { message: "invalid token" });
    }
    if (target.includes("/rest/v1/transactions")) {
      return dataStatus === 200 ? jsonResponse(200, transactions) : jsonResponse(dataStatus, { message: "boom" });
    }
    if (target.includes("/rest/v1/budgets")) {
      return dataStatus === 200 ? jsonResponse(200, budgets) : jsonResponse(dataStatus, { message: "boom" });
    }
    if (target.includes("/chat/completions")) {
      return aiStatus === 200
        ? jsonResponse(200, {
            choices: [{ message: { content: aiAnswer } }],
            usage: { prompt_tokens: 11, completion_tokens: 22 },
          })
        : jsonResponse(aiStatus, { error: { message: "stack trace internal penyedia" } });
    }
    return jsonResponse(404, {});
  };

  return {
    fetchImpl,
    calls,
    callsTo: (fragment) => calls.filter((call) => call.url.includes(fragment)),
  };
}

function ask(overrides = {}) {
  const { fetchImpl, calls, callsTo } = makeFetch(overrides.fetch ?? {});
  return {
    calls,
    callsTo,
    run: (body = {}) =>
      handleAssistantAsk({
        token: "token-sesi-pengguna",
        question: "Kategori pengeluaran terbesar bulan ini apa?",
        month: "2026-10",
        config: CONFIG,
        fetchImpl,
        now: NOW,
        ...body,
      }),
  };
}

describe("validateQuestion", () => {
  it("menerima pertanyaan wajar dan memangkas spasi", () => {
    expect(validateQuestion("  berapa pengeluaran saya?  ")).toEqual({
      ok: true,
      question: "berapa pengeluaran saya?",
    });
  });

  it("menolak input kosong, bukan teks, dan yang terlalu panjang", () => {
    expect(validateQuestion("").ok).toBe(false);
    expect(validateQuestion("   ").ok).toBe(false);
    expect(validateQuestion(123).ok).toBe(false);
    expect(validateQuestion(null).ok).toBe(false);
    const panjang = validateQuestion("a".repeat(501));
    expect(panjang.ok).toBe(false);
    expect(panjang.error).toContain("500");
  });
});

describe("parseMonthRequest", () => {
  it("memakai bulan yang valid dan jatuh ke bulan berjalan bila tidak valid", () => {
    expect(parseMonthRequest("2026-03", NOW)).toBe("2026-03");
    expect(parseMonthRequest("2026-13", NOW)).toBe("2026-10");
    expect(parseMonthRequest("bukan-bulan", NOW)).toBe("2026-10");
    expect(parseMonthRequest(undefined, NOW)).toBe("2026-10");
  });
});

describe("autentikasi dan pembatasan akses", () => {
  it("menolak permintaan tanpa token sebelum menyentuh data", async () => {
    const { run, calls } = ask();
    const result = await run({ token: "" });
    expect(result.status).toBe(401);
    expect(calls).toHaveLength(0);
  });

  it("menolak token yang tidak valid menurut Supabase Auth", async () => {
    const { run, callsTo } = ask({ fetch: { userStatus: 401 } });
    const result = await run();
    expect(result.status).toBe(401);
    expect(result.body.error).toContain("Sesi tidak valid");
    expect(callsTo("/rest/v1/")).toHaveLength(0);
  });

  it("mengambil data memakai user id hasil verifikasi token, bukan dari body request", async () => {
    const { run, callsTo } = ask();
    const result = await run({ userId: "user-b", user_id: "user-b" });
    expect(result.status).toBe(200);

    const dataCalls = callsTo("/rest/v1/transactions");
    expect(dataCalls).toHaveLength(1);
    expect(dataCalls[0].url).toContain("user_id=eq.user-a");
    expect(dataCalls[0].url).not.toContain("user-b");
  });

  it("mengembalikan 429 setelah batas frekuensi request terlewati", async () => {
    const { run } = ask();
    const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });

    const pertama = await run({ limiter });
    const kedua = await run({ limiter });

    expect(pertama.status).toBe(200);
    expect(kedua.status).toBe(429);
    expect(kedua.body.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("menolak pertanyaan kosong dengan 400 tanpa memanggil jaringan", async () => {
    const { run, calls } = ask();
    const result = await run({ question: "   " });
    expect(result.status).toBe(400);
    expect(calls).toHaveLength(0);
  });
});

describe("alur jawaban", () => {
  it("menjawab jelas dan tanpa memanggil AI saat periode belum punya data", async () => {
    const { run, callsTo } = ask();
    const result = await run({ month: "2026-01" });

    expect(result.status).toBe(200);
    expect(result.body.source).toBe("tanpa-data");
    expect(result.body.answer).toContain("Belum ada transaksi");
    expect(callsTo("/chat/completions")).toHaveLength(0);
  });

  it("mengirim pertanyaan ke model dan mengembalikan jawabannya", async () => {
    const { run, callsTo } = ask();
    const result = await run();

    expect(result.status).toBe(200);
    expect(result.body.source).toBe("ai");
    expect(result.body.answer).toBe("Jawaban dari model.");
    expect(result.body.period).toMatchObject({ month: "2026-10", transactionCount: 2, truncated: false });
    expect(result.body.usage.promptTokens).toBe(11);
    expect(callsTo("/chat/completions")).toHaveLength(1);
  });

  it("hanya mengirim angka agregat ke model: tanpa id dan tanpa keterangan transaksi", async () => {
    const { run, callsTo } = ask();
    await run();

    const aiCall = callsTo("/chat/completions")[0];
    const sentBody = aiCall.options.body;

    expect(sentBody).not.toContain("RAHASIA");
    expect(sentBody).not.toContain("11111111-1111-4111-8111-111111111111");
    expect(sentBody).not.toContain("description");
    expect(sentBody).not.toContain("user-a");
    expect(sentBody).not.toContain("contoh.test");
    // Angka hasil perhitungan aplikasi tetap ada
    expect(sentBody).toContain("8000000");
    expect(sentBody).toContain("Makanan");
    // Kunci penyedia AI tidak pernah ikut ke body, hanya ke header
    expect(sentBody).not.toContain("kunci-rahasia-server");
    expect(aiCall.options.headers.Authorization).toContain("kunci-rahasia-server");
  });

  it("menghitung simulasi menabung di server, bukan oleh model", async () => {
    const { run, callsTo } = ask();
    const result = await run({ question: "Jika saya ingin menabung 5 juta, berapa bulan?" });

    expect(result.status).toBe(200);
    expect(result.body.plan).toMatchObject({ targetAmount: 5_000_000, achievable: true });
    expect(result.body.plan.monthsNeeded).toBeGreaterThan(0);
    expect(callsTo("/chat/completions")[0].options.body).toContain("Simulasi menabung");
  });

  it("memakai perhitungan aplikasi bila penyedia AI belum dikonfigurasi", async () => {
    const { fetchImpl, callsTo } = makeFetch();
    const result = await handleAssistantAsk({
      token: "token-sesi-pengguna",
      question: "Bagaimana status anggaran saya?",
      month: "2026-10",
      config: CONFIG_TANPA_AI,
      fetchImpl,
      now: NOW,
    });

    expect(result.status).toBe(200);
    expect(result.body.source).toBe("perhitungan-aplikasi");
    expect(result.body.answer).toContain("Ringkasan Oktober 2026");
    expect(result.body.answer).toContain("Anggaran");
    expect(callsTo("/chat/completions")).toHaveLength(0);
  });
});

describe("penanganan kegagalan", () => {
  it("tidak menampilkan kegagalan penyedia AI sebagai berhasil, dan tidak membocorkan detail internal", async () => {
    const { run } = ask({ fetch: { aiStatus: 500 } });
    const result = await run();

    expect(result.status).toBe(502);
    expect(result.body.ok).toBe(false);
    expect(result.body.error).toContain("Penyedia AI sedang bermasalah");
    expect(result.body.error).not.toContain("stack trace");
  });

  it("menjelaskan batas kuota penyedia AI dengan pesan yang aman", async () => {
    const { run } = ask({ fetch: { aiStatus: 429 } });
    const result = await run();
    expect(result.status).toBe(502);
    expect(result.body.error).toContain("Batas penggunaan");
  });

  it("mengembalikan error saat database gagal dibaca", async () => {
    const { run, callsTo } = ask({ fetch: { dataStatus: 500 } });
    const result = await run();

    expect(result.status).toBe(502);
    expect(result.body.error).toContain("Gagal membaca transaksi");
    expect(callsTo("/chat/completions")).toHaveLength(0);
  });

  it("memberi pesan konfigurasi yang jelas bila backend belum diisi Supabase", async () => {
    const config = readServerEnv({});
    const { run } = ask();
    const result = await run({ config });
    expect(result.status).toBe(503);
    expect(result.body.error).toContain("belum dikonfigurasi");
  });
});
