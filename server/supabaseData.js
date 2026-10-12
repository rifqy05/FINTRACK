// Pengambilan data keuangan milik pengguna yang sedang login.
//
// Backend memakai token akses pengguna + anon key, sehingga Row Level Security
// Supabase yang membatasi data: service role key tidak dibutuhkan sama sekali.
// Filter user_id di bawah berasal dari token yang sudah diverifikasi, bukan dari
// body request, jadi pengguna tidak bisa meminta data milik orang lain.
//
// Kolom `description` sengaja tidak diambil: asisten hanya butuh angka agregat.

import { mapBudgetFromDb, mapTransactionFromDb } from "../src/services/dataMappers.js";

async function restRequest(path, { token, config, fetchImpl }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.aiTimeoutMs);
  try {
    const response = await fetchImpl(`${config.supabaseUrl}/rest/v1/${path}`, {
      method: "GET",
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchTransactionsSince({ token, userId, fromDate, limit }, config, fetchImpl = fetch) {
  const query = new URLSearchParams({
    select: "id,type,category,amount,date",
    user_id: `eq.${userId}`,
    date: `gte.${fromDate}`,
    order: "date.desc",
    limit: String(limit),
  });

  try {
    const response = await restRequest(`transactions?${query.toString()}`, { token, config, fetchImpl });
    if (response.status === 401 || response.status === 403) {
      return { ok: false, error: "Akses data ditolak. Silakan masuk kembali." };
    }
    if (!response.ok) {
      return { ok: false, error: "Gagal membaca transaksi dari database." };
    }
    const rows = await response.json();
    if (!Array.isArray(rows)) {
      return { ok: false, error: "Format data transaksi tidak dikenali." };
    }
    return {
      ok: true,
      transactions: rows.map(mapTransactionFromDb),
      truncated: rows.length >= limit,
    };
  } catch {
    return { ok: false, error: "Tidak dapat menghubungi database." };
  }
}

export async function fetchBudgetsForMonth({ token, userId, month }, config, fetchImpl = fetch) {
  const query = new URLSearchParams({
    select: "id,month,category,limit_amount",
    user_id: `eq.${userId}`,
    month: `eq.${month}`,
    limit: "200",
  });

  try {
    const response = await restRequest(`budgets?${query.toString()}`, { token, config, fetchImpl });
    if (response.status === 401 || response.status === 403) {
      return { ok: false, error: "Akses data ditolak. Silakan masuk kembali." };
    }
    if (!response.ok) {
      return { ok: false, error: "Gagal membaca anggaran dari database." };
    }
    const rows = await response.json();
    if (!Array.isArray(rows)) {
      return { ok: false, error: "Format data anggaran tidak dikenali." };
    }
    return { ok: true, budgets: rows.map(mapBudgetFromDb) };
  } catch {
    return { ok: false, error: "Tidak dapat menghubungi database." };
  }
}
