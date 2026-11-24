import { supabase } from "./supabaseClient.js";
import { mapTransactionFromDb, mapTransactionToDb, toDeterministicUuid } from "./dataMappers.js";

const PAGE_SIZE = 1000;

export async function fetchTransactions(userId) {
  if (!supabase || !userId) {
    return { ok: false, error: "Koneksi database atau sesi pengguna tidak tersedia." };
  }
  try {
    const allRows = [];
    let from = 0;

    // Ambil secara bertahap agar tidak terpotong batas bawaan 1.000 baris PostgREST.
    while (true) {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        return { ok: false, error: error.message || "Gagal mengambil data transaksi." };
      }

      const chunk = data || [];
      allRows.push(...chunk);
      if (chunk.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }

    return { ok: true, data: allRows.map(mapTransactionFromDb) };
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
    const dbId = toDeterministicUuid(transaction.id, userId);
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
    const dbId = toDeterministicUuid(id, userId);
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

export async function deleteAllTransactions(userId) {
  if (!supabase || !userId) {
    return { ok: false, error: "Koneksi database atau sesi pengguna tidak tersedia." };
  }
  try {
    const { error } = await supabase.from("transactions").delete().eq("user_id", userId);
    if (error) {
      return { ok: false, error: error.message || "Gagal menghapus seluruh transaksi dari cloud." };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || "Terjadi kesalahan saat menghapus seluruh transaksi." };
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
