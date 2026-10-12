// Klien frontend untuk backend AI Financial Assistant.
//
// Frontend tidak pernah memegang API key penyedia AI. Pertanyaan dikirim ke
// backend FinTrack sendiri (folder server/) bersama token sesi Supabase, dan
// backend itulah yang memverifikasi sesi, menghitung angka, lalu memanggil model.

import { getSession } from "./authService.js";

const CONSENT_KEY = "fintrack_ai_consent_v1";

export const MAX_QUESTION_LENGTH = 500;
export const ASSISTANT_API_URL = (import.meta.env.VITE_ASSISTANT_API_URL || "http://localhost:8787").replace(
  /\/+$/,
  "",
);

export const SUGGESTED_QUESTIONS = [
  "Berapa total pemasukan dan pengeluaran bulan ini?",
  "Kategori pengeluaran terbesar bulan ini apa?",
  "Bandingkan pengeluaran bulan ini dengan bulan sebelumnya.",
  "Kategori apa yang paling meningkat?",
  "Bagaimana status anggaran saya?",
  "Jika saya ingin menabung 5 juta, berapa bulan yang dibutuhkan?",
];

function storage() {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  } catch {
    return null;
  }
  return null;
}

/* ---------- Persetujuan pengiriman data ke penyedia AI ---------- */

export function hasAiConsent() {
  try {
    return storage()?.getItem(CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

export function saveAiConsent() {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(CONSENT_KEY, "granted");
    return true;
  } catch {
    return false;
  }
}

export function clearAiConsent() {
  const store = storage();
  if (!store) return false;
  try {
    store.removeItem(CONSENT_KEY);
    return true;
  } catch {
    return false;
  }
}

/* ---------- Pemanggilan backend ---------- */

export async function checkAssistantHealth() {
  try {
    const response = await fetch(`${ASSISTANT_API_URL}/api/health`, { method: "GET" });
    if (!response.ok) return { ok: false, error: `Server asisten merespons dengan kode ${response.status}.` };
    const data = await response.json();
    return { ok: true, aiConfigured: data.penyediaAi === "aktif", supabase: data.supabase };
  } catch {
    return { ok: false, error: "Server asisten tidak dapat dihubungi." };
  }
}

export async function askAssistant(question, month) {
  const trimmed = typeof question === "string" ? question.trim() : "";
  if (trimmed === "") return { ok: false, error: "Pertanyaan tidak boleh kosong." };
  if (trimmed.length > MAX_QUESTION_LENGTH) {
    return { ok: false, error: `Pertanyaan maksimal ${MAX_QUESTION_LENGTH} karakter.` };
  }

  const session = await getSession();
  const token = session?.access_token;
  if (!token) {
    return { ok: false, error: "Sesi tidak ditemukan. Silakan masuk ke akun FinTrack Anda." };
  }

  try {
    const response = await fetch(`${ASSISTANT_API_URL}/api/assistant/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ question: trimmed, month }),
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok || !data?.ok) {
      return {
        ok: false,
        error: data?.error || `Server asisten tidak dapat memproses permintaan (kode ${response.status}).`,
        retryAfterSeconds: data?.retryAfterSeconds ?? null,
      };
    }

    return {
      ok: true,
      answer: data.answer,
      period: data.period ?? null,
      source: data.source ?? null,
      notice: data.notice ?? null,
    };
  } catch {
    return {
      ok: false,
      error: `Tidak dapat menghubungi server asisten di ${ASSISTANT_API_URL}. Pastikan backend berjalan (npm run server).`,
    };
  }
}
