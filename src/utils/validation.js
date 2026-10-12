// Validasi input form, data localStorage, dan file import JSON.

import { MAX_AMOUNT, MAX_DESCRIPTION_LENGTH, PAYMENT_METHODS, EXPENSE_CATEGORIES, categoriesFor } from "./constants.js";
import { isValidISODate, isValidMonthKey } from "./dates.js";

function parseAmount(raw) {
  if (typeof raw === "number") return raw;
  const text = String(raw ?? "").trim();
  if (text === "") return null;
  if (!/^\d+$/.test(text)) return NaN;
  return Number(text);
}

function checkAmount(raw, label = "Nominal") {
  const amount = parseAmount(raw);
  if (amount === null) return `${label} wajib diisi.`;
  if (!Number.isFinite(amount)) return `${label} harus berupa angka.`;
  if (amount <= 0) return `${label} harus lebih besar dari nol.`;
  if (!Number.isInteger(amount)) return `${label} harus bilangan bulat (tanpa desimal).`;
  if (amount > MAX_AMOUNT) return `${label} terlalu besar.`;
  return null;
}

// Dipakai form transaksi. Mengembalikan pesan error per field dan data yang sudah dibersihkan.
export function validateTransactionInput(values) {
  const errors = {};
  const { type, date, category, paymentMethod } = values;
  const description = String(values.description ?? "").trim();

  if (type !== "income" && type !== "expense") errors.type = "Pilih jenis transaksi.";

  if (!date) errors.date = "Tanggal wajib diisi.";
  else if (!isValidISODate(date)) errors.date = "Format tanggal tidak valid.";

  if (!category) errors.category = "Pilih kategori.";
  else if (!errors.type && !categoriesFor(type).includes(category)) {
    errors.category = "Kategori tidak sesuai dengan jenis transaksi.";
  }

  const amountError = checkAmount(values.amount);
  if (amountError) errors.amount = amountError;

  if (!PAYMENT_METHODS.includes(paymentMethod)) errors.paymentMethod = "Pilih metode pembayaran.";

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Keterangan maksimal ${MAX_DESCRIPTION_LENGTH} karakter.`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    clean: { type, date, category, description, amount: parseAmount(values.amount), paymentMethod },
  };
}

export function validateBudgetInput(values) {
  const errors = {};
  if (!isValidMonthKey(values.month)) errors.month = "Pilih bulan anggaran.";
  if (!EXPENSE_CATEGORIES.includes(values.category)) errors.category = "Pilih kategori pengeluaran.";
  const limitError = checkAmount(values.limit, "Batas anggaran");
  if (limitError) errors.limit = limitError;
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    clean: { month: values.month, category: values.category, limit: parseAmount(values.limit) },
  };
}

/* ---------- Data yang sudah tersimpan (localStorage / import) ---------- */

// Mengembalikan teks error, atau null jika transaksi valid.
export function getTransactionError(t) {
  if (!t || typeof t !== "object" || Array.isArray(t)) return "bukan objek transaksi.";
  if (typeof t.id !== "string" || t.id === "" || t.id.length > 100) return "id tidak valid.";
  if (typeof t.amount !== "number") return "nominal harus disimpan sebagai angka.";
  if (t.description !== undefined && typeof t.description !== "string") return "keterangan harus berupa teks.";
  const { errors } = validateTransactionInput({ ...t, description: t.description ?? "" });
  const first = Object.values(errors)[0];
  return first ?? null;
}

export function getBudgetError(b) {
  if (!b || typeof b !== "object" || Array.isArray(b)) return "bukan objek anggaran.";
  if (typeof b.limit !== "number") return "batas harus disimpan sebagai angka.";
  const { errors } = validateBudgetInput(b);
  return Object.values(errors)[0] ?? null;
}

export function normalizeTransaction(t) {
  return {
    id: t.id,
    date: t.date,
    type: t.type,
    category: t.category,
    description: (t.description ?? "").trim(),
    amount: t.amount,
    paymentMethod: t.paymentMethod,
  };
}

export function normalizeBudget(b) {
  return { month: b.month, category: b.category, limit: b.limit };
}

// Memeriksa seluruh file backup sebelum data lama diganti.
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "File bukan JSON yang valid." };
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, error: "Struktur file tidak dikenali." };
  }
  if (data.app !== "fintrack") return { ok: false, error: "File ini bukan backup FinTrack." };
  if (data.version !== 1) return { ok: false, error: `Versi backup (${String(data.version)}) belum didukung.` };
  if (!Array.isArray(data.transactions) || !Array.isArray(data.budgets)) {
    return { ok: false, error: "Backup harus berisi daftar transaksi dan anggaran." };
  }

  const ids = new Set();
  for (let i = 0; i < data.transactions.length; i += 1) {
    const problem = getTransactionError(data.transactions[i]);
    if (problem) return { ok: false, error: `Transaksi ke-${i + 1}: ${problem}` };
    if (ids.has(data.transactions[i].id)) return { ok: false, error: `Transaksi ke-${i + 1}: id ganda.` };
    ids.add(data.transactions[i].id);
  }

  const budgetKeys = new Set();
  for (let i = 0; i < data.budgets.length; i += 1) {
    const problem = getBudgetError(data.budgets[i]);
    if (problem) return { ok: false, error: `Anggaran ke-${i + 1}: ${problem}` };
    const key = `${data.budgets[i].month}|${data.budgets[i].category}`;
    if (budgetKeys.has(key)) return { ok: false, error: `Anggaran ke-${i + 1}: bulan dan kategori ganda.` };
    budgetKeys.add(key);
  }

  return {
    ok: true,
    data: {
      transactions: data.transactions.map(normalizeTransaction),
      budgets: data.budgets.map(normalizeBudget),
    },
  };
}
