import { supabase } from "./supabaseClient.js";
import { mapTransactionFromDb, mapTransactionToDb, toDeterministicUuid } from "./dataMappers.js";

export async function fetchTransactions(userId) {
  if (!supabase || !userId) {
    return { ok: false, error: "Koneksi database atau sesi pengguna tidak tersedia." };
  }
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return { ok: false, error: error.message || "Gagal mengambil data transaksi." };
    }
    return { ok: true, data: (data || []).map(mapTransactionFromDb) };
  } catch (err) {
    return { ok: false, error: err.message || "Gagal memuat transaksi dari cloud." };
  }
}

export async function createTransaction(transaction, userId) {
  if (!supabase || !userId) {
    return { ok: false, error: "Koneksi database atau sesi pengguna tidak tersedia." };
  }
  try {
    const payload = mapTransactionToDb(transaction, userId);
    const { data, error } = await supabase
      .from("transactions")
      .insert([payload])
      .select()
      .single();

    if (error) {
      return { ok: false, error: error.message || "Gagal menyimpan transaksi ke cloud." };
    }
    return { ok: true, data: mapTransactionFromDb(data) };
  } catch (err) {
    return { ok: false, error: err.message || "Terjadi kesalahan saat menyimpan transaksi." };
  }
}

export async function updateTransaction(transaction, userId) {
  if (!supabase || !userId) {
    return { ok: false, error: "Koneksi database atau sesi pengguna tidak tersedia." };
  }
  try {
    const dbId = toDeterministicUuid(transaction.id);
    const payload = {
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      date: transaction.date,
      description: (transaction.description ?? "").trim(),
      payment_method: transaction.paymentMethod || "Tunai",
    };

    const { data, error } = await supabase
      .from("transactions")
      .update(payload)
      .eq("id", dbId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return { ok: false, error: error.message || "Gagal memperbarui transaksi di cloud." };
    }
    return { ok: true, data: mapTransactionFromDb(data) };
  } catch (err) {
    return { ok: false, error: err.message || "Terjadi kesalahan saat memperbarui transaksi." };
  }
}

export async function deleteTransaction(id, userId) {
  if (!supabase || !userId) {
    return { ok: false, error: "Koneksi database atau sesi pengguna tidak tersedia." };
  }
  try {
    const dbId = toDeterministicUuid(id);
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", dbId)
      .eq("user_id", userId);

    if (error) {
      return { ok: false, error: error.message || "Gagal menghapus transaksi dari cloud." };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || "Terjadi kesalahan saat menghapus transaksi." };
  }
}

export async function batchUpsertTransactions(transactions, userId) {
  if (!supabase || !userId) {
    return { ok: false, error: "Koneksi database atau sesi pengguna tidak tersedia." };
  }
  if (!transactions.length) {
    return { ok: true, count: 0 };
  }
  try {
    const payloads = transactions.map((t) => mapTransactionToDb(t, userId));
    const { error } = await supabase
      .from("transactions")
      .upsert(payloads, { onConflict: "id" });

    if (error) {
      return { ok: false, error: error.message || "Gagal melakukan sinkronisasi transaksi batch." };
    }
    return { ok: true, count: payloads.length };
  } catch (err) {
    return { ok: false, error: err.message || "Terjadi kesalahan saat migrasi transaksi." };
  }
}
