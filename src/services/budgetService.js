import { supabase } from "./supabaseClient.js";
import { mapBudgetFromDb, mapBudgetToDb } from "./dataMappers.js";

export async function fetchBudgets(userId) {
  if (!supabase || !userId) {
    return { ok: false, error: "Koneksi database atau sesi pengguna tidak tersedia." };
  }
  try {
    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userId)
      .order("month", { ascending: false });

    if (error) {
      return { ok: false, error: error.message || "Gagal mengambil data anggaran." };
    }
    return { ok: true, data: (data || []).map(mapBudgetFromDb) };
  } catch (err) {
    return { ok: false, error: err.message || "Gagal memuat anggaran dari cloud." };
  }
}

export async function saveBudget(budget, userId) {
  if (!supabase || !userId) {
    return { ok: false, error: "Koneksi database atau sesi pengguna tidak tersedia." };
  }
  try {
    const payload = mapBudgetToDb(budget, userId);
    const { data, error } = await supabase
      .from("budgets")
      .upsert(payload, { onConflict: "user_id,month,category" })
      .select()
      .single();

    if (error) {
      return { ok: false, error: error.message || "Gagal menyimpan anggaran ke cloud." };
    }
    return { ok: true, data: mapBudgetFromDb(data) };
  } catch (err) {
    return { ok: false, error: err.message || "Terjadi kesalahan saat menyimpan anggaran." };
  }
}

export async function deleteBudget({ month, category }, userId) {
  if (!supabase || !userId) {
    return { ok: false, error: "Koneksi database atau sesi pengguna tidak tersedia." };
  }
  try {
    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("user_id", userId)
      .eq("month", month)
      .eq("category", category);

    if (error) {
      return { ok: false, error: error.message || "Gagal menghapus anggaran dari cloud." };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || "Terjadi kesalahan saat menghapus anggaran." };
  }
}

export async function batchUpsertBudgets(budgets, userId) {
  if (!supabase || !userId) {
    return { ok: false, error: "Koneksi database atau sesi pengguna tidak tersedia." };
  }
  if (!budgets.length) {
    return { ok: true, count: 0 };
  }
  try {
    const payloads = budgets.map((b) => mapBudgetToDb(b, userId));
    const { error } = await supabase
      .from("budgets")
      .upsert(payloads, { onConflict: "user_id,month,category" });

    if (error) {
      return { ok: false, error: error.message || "Gagal melakukan sinkronisasi anggaran batch." };
    }
    return { ok: true, count: payloads.length };
  } catch (err) {
    return { ok: false, error: err.message || "Terjadi kesalahan saat migrasi anggaran." };
  }
}
