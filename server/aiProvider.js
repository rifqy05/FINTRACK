// Pemanggilan penyedia model AI dari sisi server.
//
// API key hanya ada di environment server dan tidak pernah dikirim ke browser.
// Model hanya menerima angka agregat hasil perhitungan aplikasi (lihat
// toAiPayload di src/utils/financeSummary.js) dan hanya diminta menjelaskannya.

import { MAX_TARGET_AMOUNT } from "../src/utils/financeSummary.js";

export const SYSTEM_PROMPT = [
  "Anda adalah Asisten Keuangan FinTrack, asisten untuk aplikasi pencatatan keuangan pribadi.",
  "Aturan yang wajib dipatuhi:",
  "1. Jawab dalam Bahasa Indonesia yang jelas, ramah, dan ringkas (maksimal 3 paragraf pendek).",
  "2. SEMUA angka wajib diambil apa adanya dari ringkasan JSON yang diberikan. Jangan menghitung ulang, membulatkan ulang, atau mengarang angka.",
  "3. Jika sebuah angka tidak ada di ringkasan atau bernilai null, katakan bahwa datanya belum tersedia. Jangan menebak.",
  "4. Sebutkan periode data yang dianalisis pada jawaban Anda.",
  "5. Anda hanya memiliki akses baca. Jangan pernah menyatakan bahwa Anda sudah menambah, mengubah, atau menghapus transaksi.",
  "6. Jangan meminta data pribadi, jangan membahas istilah teknis (JSON, prompt, sistem), dan jangan menyebut nomor transaksi.",
  "7. Bila data tidak lengkap atau terpotong, sampaikan keterbatasan itu secara singkat.",
].join("\n");

export function buildMessages({ question, summaryPayload, plan }) {
  const parts = [
    `Pertanyaan pengguna: ${question}`,
    "",
    "Ringkasan keuangan pengguna (sumber angka, jangan diubah):",
    JSON.stringify(summaryPayload, null, 1),
  ];

  if (plan) {
    parts.push(
      "",
      "Simulasi menabung yang sudah dihitung aplikasi (pakai angka ini apa adanya):",
      JSON.stringify(plan, null, 1),
    );
  }

  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: parts.join("\n") },
  ];
}

function safeProviderError(status) {
  if (status === 401 || status === 403) {
    return "Permintaan ke penyedia AI ditolak. Periksa AI_PROVIDER_API_KEY di berkas .env server.";
  }
  if (status === 429) {
    return "Batas penggunaan penyedia AI sedang tercapai. Coba lagi beberapa saat lagi.";
  }
  if (status === 402) {
    return "Kuota penyedia AI habis. Periksa saldo akun penyedia AI Anda.";
  }
  if (status >= 500) {
    return "Penyedia AI sedang bermasalah. Data keuangan Anda tetap aman. Coba lagi nanti.";
  }
  return `Penyedia AI menolak permintaan (kode ${status}).`;
}

export async function askAiModel({ question, summaryPayload, plan, config, fetchImpl = fetch }) {
  if (!config.aiEnabled) {
    return { ok: false, status: 503, error: "Asisten AI belum dikonfigurasi di server." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.aiTimeoutMs);

  try {
    const response = await fetchImpl(`${config.aiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.aiApiKey}`,
      },
      body: JSON.stringify({
        model: config.aiModel,
        temperature: 0.2,
        max_tokens: config.aiMaxTokens,
        messages: buildMessages({ question, summaryPayload, plan }),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, status: 502, error: safeProviderError(response.status) };
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || answer.trim() === "") {
      return { ok: false, status: 502, error: "Penyedia AI tidak mengirim jawaban. Coba lagi." };
    }

    return {
      ok: true,
      answer: answer.trim(),
      usage: {
        promptTokens: data?.usage?.prompt_tokens ?? null,
        completionTokens: data?.usage?.completion_tokens ?? null,
      },
    };
  } catch {
    return {
      ok: false,
      status: 504,
      error: "Permintaan ke penyedia AI gagal atau melebihi batas waktu. Data keuangan Anda tetap aman.",
    };
  } finally {
    clearTimeout(timer);
  }
}

// Dipakai untuk memastikan tidak ada angka di luar rentang wajar yang lolos ke
// model. Dijalankan sebelum request dikirim.
export function isAmountInRange(value) {
  return Number.isFinite(value) && Math.abs(value) <= MAX_TARGET_AMOUNT;
}
