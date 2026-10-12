// Orkestrasi AI Financial Assistant (FR-07).
//
// Urutan yang selalu dijalankan:
//   1. validasi pertanyaan (panjang dan tipe),
//   2. verifikasi identitas pengguna lewat Supabase Auth,
//   3. pembatasan frekuensi request per pengguna,
//   4. ambil data dengan batas periode dan jumlah baris,
//   5. hitung angka dengan fungsi keuangan aplikasi (deterministik),
//   6. validasi ringkasan, lalu kirim hanya angka agregat ke model AI,
//   7. kembalikan jawaban. Kegagalan AI tidak pernah mengubah data keuangan.
//
// Fungsi ini tidak menyentuh jaringan secara langsung: semua pemanggilan lewat
// fetchImpl yang bisa diganti saat pengujian.

import {
  buildFinanceSummary,
  buildSavingsPlan,
  extractTargetAmount,
  toAiPayload,
  validateSummaryForAi,
} from "../src/utils/financeSummary.js";
import { addMonths, currentMonthKey, isValidMonthKey } from "../src/utils/dates.js";
import { askAiModel } from "./aiProvider.js";
import { buildEmptyPeriodAnswer, buildFallbackAnswer } from "./fallbackAnswer.js";
import { fetchBudgetsForMonth, fetchTransactionsSince } from "./supabaseData.js";
import { verifyAccessToken } from "./supabaseAuth.js";

export const MAX_QUESTION_LENGTH = 500;

export function validateQuestion(question, maxLength = MAX_QUESTION_LENGTH) {
  if (typeof question !== "string") {
    return { ok: false, error: "Pertanyaan tidak valid." };
  }
  const trimmed = question.trim();
  if (trimmed === "") {
    return { ok: false, error: "Pertanyaan tidak boleh kosong." };
  }
  if (trimmed.length > maxLength) {
    return { ok: false, error: `Pertanyaan maksimal ${maxLength} karakter.` };
  }
  return { ok: true, question: trimmed };
}

export function parseMonthRequest(month, now = new Date()) {
  return isValidMonthKey(month) ? month : currentMonthKey(now);
}

function periodInfo(summary) {
  return {
    month: summary.period.month,
    label: summary.period.label,
    comparedMonth: summary.period.comparedMonth,
    comparedLabel: summary.period.comparedLabel,
    transactionCount: summary.totals.transactionCount,
    rowsRead: summary.meta.transactionCount,
    truncated: summary.meta.truncated,
    latestDate: summary.meta.latestDate,
  };
}

export async function handleAssistantAsk({
  token,
  question,
  month,
  config,
  fetchImpl = fetch,
  limiter,
  now = new Date(),
}) {
  const questionResult = validateQuestion(question, config.maxQuestionLength);
  if (!questionResult.ok) {
    return { status: 400, body: { ok: false, error: questionResult.error } };
  }

  const auth = await verifyAccessToken(token, config, fetchImpl);
  if (!auth.ok) {
    return { status: auth.status, body: { ok: false, error: auth.error } };
  }

  if (limiter) {
    const limit = limiter.check(auth.user.id);
    if (!limit.allowed) {
      return {
        status: 429,
        body: {
          ok: false,
          error: `Terlalu banyak permintaan. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
          retryAfterSeconds: limit.retryAfterSeconds,
        },
      };
    }
  }

  const monthKey = parseMonthRequest(month, now);
  const fromDate = `${addMonths(monthKey, -config.dataMonthsBack)}-01`;

  const [transactionResult, budgetResult] = await Promise.all([
    fetchTransactionsSince({ token, userId: auth.user.id, fromDate, limit: config.dataRowLimit }, config, fetchImpl),
    fetchBudgetsForMonth({ token, userId: auth.user.id, month: monthKey }, config, fetchImpl),
  ]);

  if (!transactionResult.ok) {
    return { status: 502, body: { ok: false, error: transactionResult.error } };
  }
  if (!budgetResult.ok) {
    return { status: 502, body: { ok: false, error: budgetResult.error } };
  }

  const summary = buildFinanceSummary({
    transactions: transactionResult.transactions,
    budgets: budgetResult.budgets,
    month: monthKey,
    today: now,
    truncated: transactionResult.truncated,
  });

  const targetAmount = extractTargetAmount(questionResult.question);
  const plan = targetAmount ? buildSavingsPlan({ savings: summary.savings, targetAmount }) : null;

  // Periode tanpa data dijawab tanpa memanggil model AI: lebih murah dan pasti jelas.
  if (!summary.hasData) {
    return {
      status: 200,
      body: {
        ok: true,
        source: "tanpa-data",
        answer: buildEmptyPeriodAnswer(summary),
        period: periodInfo(summary),
      },
    };
  }

  const payload = toAiPayload(summary);
  const validation = validateSummaryForAi(payload);
  if (!validation.ok) {
    // Tidak pernah mengirim ringkasan yang gagal validasi, dan tidak membocorkan detailnya.
    return { status: 500, body: { ok: false, error: "Ringkasan data tidak lolos pemeriksaan keamanan." } };
  }

  if (!config.aiEnabled) {
    return {
      status: 200,
      body: {
        ok: true,
        source: "perhitungan-aplikasi",
        answer: buildFallbackAnswer({ summary, plan }),
        period: periodInfo(summary),
        plan,
        notice: "Penyedia AI belum dikonfigurasi di server, jawaban ini dihitung langsung oleh aplikasi.",
      },
    };
  }

  const aiResult = await askAiModel({
    question: questionResult.question,
    summaryPayload: payload,
    plan,
    config,
    fetchImpl,
  });

  if (!aiResult.ok) {
    return { status: aiResult.status, body: { ok: false, error: aiResult.error } };
  }

  return {
    status: 200,
    body: {
      ok: true,
      source: "ai",
      answer: aiResult.answer,
      period: periodInfo(summary),
      plan,
      usage: aiResult.usage,
    },
  };
}
