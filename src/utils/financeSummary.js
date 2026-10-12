// Ringkasan keuangan deterministik untuk AI Financial Assistant (FR-07).
//
// Modul ini adalah SATU-SATUNYA sumber angka untuk fitur asisten. Frontend dan
// backend memanggil fungsi yang sama, jadi model AI hanya bertugas menjelaskan
// hasil perhitungan aplikasi dan tidak pernah menjadi sumber kebenaran angka.
//
// Ringkasan yang boleh dikirim ke penyedia AI hanya berisi angka agregat:
// tanpa id transaksi, tanpa keterangan (description), dan tanpa identitas pengguna.

import { addMonths, currentMonthKey, formatMonthLabel, isValidMonthKey, monthKeyOf } from "./dates.js";
import {
  budgetUsageForMonth,
  calculateExpense,
  calculateIncome,
  calculateSavingRate,
  filterByMonth,
} from "./financeCalculations.js";

export const CATEGORY_LIMIT = 5; // kategori teratas yang dilaporkan
export const SAVINGS_AVERAGE_MONTHS = 3; // dasar rata-rata untuk simulasi menabung
export const MAX_TARGET_AMOUNT = 1_000_000_000_000; // 1 triliun, sama dengan batas input transaksi

const round2 = (value) => Math.round(value * 100) / 100;

// Perubahan persen. Mengembalikan null (bukan Infinity/NaN) jika pembagi nol.
function percentChange(current, previous) {
  if (!(previous > 0)) return null;
  return round2(((current - previous) / previous) * 100);
}

/* ---------- Agregasi per kategori ---------- */

function totalsByCategory(transactions, type) {
  const totals = new Map();
  for (const transaction of transactions) {
    if (transaction.type !== type) continue;
    totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + transaction.amount);
  }
  return totals;
}

// Kategori terbesar lebih dulu, lengkap dengan porsi dari total jenis tersebut.
export function topCategories(transactions, type = "expense", limit = CATEGORY_LIMIT) {
  const totals = totalsByCategory(transactions, type);
  const total = [...totals.values()].reduce((sum, amount) => sum + amount, 0);
  return [...totals.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      percent: total > 0 ? round2((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

// Kategori yang berubah dibanding bulan sebelumnya. Urut dari kenaikan terbesar.
export function categoryChanges(currentTransactions, previousTransactions, type = "expense") {
  const current = totalsByCategory(currentTransactions, type);
  const previous = totalsByCategory(previousTransactions, type);
  const categories = new Set([...current.keys(), ...previous.keys()]);

  return [...categories]
    .map((category) => {
      const amount = current.get(category) ?? 0;
      const previousAmount = previous.get(category) ?? 0;
      return {
        category,
        amount,
        previousAmount,
        delta: amount - previousAmount,
        percentChange: percentChange(amount, previousAmount),
      };
    })
    .filter((entry) => entry.delta !== 0)
    .sort((a, b) => b.delta - a.delta);
}

/* ---------- Simulasi menabung (dasar rata-rata) ---------- */

export function savingsBaseline(transactions, monthKeys) {
  const perMonth = monthKeys.map((month) => {
    const inMonth = filterByMonth(transactions, month);
    const income = calculateIncome(inMonth);
    const expense = calculateExpense(inMonth);
    return { month, income, expense, surplus: income - expense, count: inMonth.length };
  });

  // Bulan tanpa transaksi tidak dihitung supaya rata-rata tidak turun palsu.
  const used = perMonth.filter((entry) => entry.count > 0);
  const divisor = used.length || 1;
  const sum = (field) => used.reduce((total, entry) => total + entry[field], 0);

  return {
    months: monthKeys.slice(),
    monthsUsed: used.length,
    averageIncome: Math.round(sum("income") / divisor),
    averageExpense: Math.round(sum("expense") / divisor),
    averageMonthlySurplus: Math.round(sum("surplus") / divisor),
  };
}

// Angka dari pertanyaan pengguna (mis. "menabung 5 juta") dihitung di sini,
// bukan diserahkan ke model AI.
export function extractTargetAmount(text) {
  if (typeof text !== "string" || text.trim() === "") return null;

  const match = text.toLowerCase().match(/(\d[\d.,]*)\s*(triliun|miliar|milyar|juta|jt|ribu|rb|k)?/);
  if (!match) return null;

  const rawNumber = match[1];
  const unit = match[2] ?? "";

  let normalized = rawNumber;
  if (rawNumber.includes(".") && rawNumber.includes(",")) {
    // 1.500.000,50 -> titik ribuan, koma desimal
    normalized = rawNumber.replace(/\./g, "").replace(",", ".");
  } else if (rawNumber.includes(",")) {
    normalized = rawNumber.replace(",", ".");
  } else if (rawNumber.includes(".")) {
    const parts = rawNumber.split(".");
    const looksLikeThousands = parts.length > 2 || (parts.length === 2 && parts[1].length === 3);
    normalized = looksLikeThousands ? parts.join("") : parts.join(".");
  }

  const base = Number(normalized);
  if (!Number.isFinite(base) || base <= 0) return null;

  const multiplier =
    {
      triliun: 1_000_000_000_000,
      miliar: 1_000_000_000,
      milyar: 1_000_000_000,
      juta: 1_000_000,
      jt: 1_000_000,
      ribu: 1_000,
      rb: 1_000,
      k: 1_000,
    }[unit] ?? 1;

  const amount = Math.round(base * multiplier);
  if (amount <= 0 || amount > MAX_TARGET_AMOUNT) return null;
  return amount;
}

// Simulasi penghematan deterministik: berapa bulan untuk mencapai target
// berdasarkan rata-rata surplus bulanan pengguna.
export function buildSavingsPlan({ savings, targetAmount }) {
  if (!(targetAmount > 0) || !savings) return null;
  const surplus = savings.averageMonthlySurplus;
  const achievable = surplus > 0;
  return {
    targetAmount,
    monthlySurplus: surplus,
    averageMonthlyExpense: savings.averageExpense,
    monthsNeeded: achievable ? Math.ceil(targetAmount / surplus) : null,
    achievable,
    basedOnMonths: savings.monthsUsed,
  };
}

/* ---------- Ringkasan utama ---------- */

export function buildFinanceSummary({
  transactions = [],
  budgets = [],
  month,
  today = new Date(),
  truncated = false,
} = {}) {
  const monthKey = isValidMonthKey(month) ? month : currentMonthKey(today);
  const previousMonthKey = addMonths(monthKey, -1);
  const savingsMonths = Array.from({ length: SAVINGS_AVERAGE_MONTHS }, (_, index) => addMonths(monthKey, -(index + 1)));

  const inMonth = filterByMonth(transactions, monthKey);
  const inPreviousMonth = filterByMonth(transactions, previousMonthKey);

  const income = calculateIncome(inMonth);
  const expense = calculateExpense(inMonth);
  const previousIncome = calculateIncome(inPreviousMonth);
  const previousExpense = calculateExpense(inPreviousMonth);

  const dates = transactions
    .map((transaction) => transaction.date)
    .filter((date) => typeof date === "string")
    .sort();
  const monthsWithData = new Set(transactions.map((transaction) => monthKeyOf(transaction.date)));

  const changes = categoryChanges(inMonth, inPreviousMonth, "expense");

  return {
    period: {
      month: monthKey,
      label: formatMonthLabel(monthKey),
      comparedMonth: previousMonthKey,
      comparedLabel: formatMonthLabel(previousMonthKey),
    },
    hasData: inMonth.length > 0,
    hasPreviousData: inPreviousMonth.length > 0,
    totals: {
      income,
      expense,
      balance: income - expense,
      savingRate: calculateSavingRate(income, expense),
      transactionCount: inMonth.length,
    },
    previous: {
      income: previousIncome,
      expense: previousExpense,
      balance: previousIncome - previousExpense,
      savingRate: calculateSavingRate(previousIncome, previousExpense),
      transactionCount: inPreviousMonth.length,
    },
    change: {
      incomePercent: percentChange(income, previousIncome),
      expensePercent: percentChange(expense, previousExpense),
      expenseDelta: expense - previousExpense,
      incomeDelta: income - previousIncome,
    },
    topExpenseCategories: topCategories(inMonth, "expense"),
    topIncomeCategories: topCategories(inMonth, "income"),
    risingCategories: changes.filter((entry) => entry.delta > 0),
    fallingCategories: changes.filter((entry) => entry.delta < 0).reverse(),
    budgets: budgetUsageForMonth(budgets, transactions, monthKey).map((entry) => ({
      category: entry.budget.category,
      limit: entry.budget.limit,
      spent: entry.spent,
      remaining: entry.remaining,
      percent: round2(entry.percent),
      status: entry.status,
    })),
    savings: savingsBaseline(transactions, savingsMonths),
    meta: {
      transactionCount: transactions.length,
      monthsCovered: monthsWithData.size,
      earliestDate: dates[0] ?? null,
      latestDate: dates[dates.length - 1] ?? null,
      categoryLimit: CATEGORY_LIMIT,
      truncated: Boolean(truncated),
    },
  };
}

/* ---------- Ringkasan yang dikirim ke penyedia AI ---------- */

// Daftar putih eksplisit. Apa pun yang tidak ada di sini tidak akan pernah
// sampai ke model AI, termasuk id transaksi dan keterangan transaksi.
export function toAiPayload(summary) {
  if (!summary) return null;
  const { period, totals, previous, change, savings } = summary;
  return {
    periode: {
      bulan: period.month,
      label: period.label,
      bulan_pembanding: period.comparedMonth,
      label_pembanding: period.comparedLabel,
    },
    ada_data: summary.hasData,
    ada_data_bulan_pembanding: summary.hasPreviousData,
    ringkasan_bulan_ini: {
      pemasukan: totals.income,
      pengeluaran: totals.expense,
      selisih: totals.balance,
      saving_rate_persen: totals.savingRate,
      jumlah_transaksi: totals.transactionCount,
    },
    ringkasan_bulan_pembanding: {
      pemasukan: previous.income,
      pengeluaran: previous.expense,
      selisih: previous.balance,
      saving_rate_persen: previous.savingRate,
      jumlah_transaksi: previous.transactionCount,
    },
    perubahan: {
      pemasukan_persen: change.incomePercent,
      pengeluaran_persen: change.expensePercent,
      selisih_pengeluaran: change.expenseDelta,
      selisih_pemasukan: change.incomeDelta,
    },
    kategori_pengeluaran_teratas: summary.topExpenseCategories,
    kategori_pemasukan_teratas: summary.topIncomeCategories,
    kategori_meningkat: summary.risingCategories.slice(0, CATEGORY_LIMIT),
    kategori_menurun: summary.fallingCategories.slice(0, CATEGORY_LIMIT),
    anggaran: summary.budgets,
    rata_rata_bulanan: {
      bulan_dianalisis: savings.months,
      bulan_berisi_data: savings.monthsUsed,
      pemasukan_rata_rata: savings.averageIncome,
      pengeluaran_rata_rata: savings.averageExpense,
      surplus_rata_rata: savings.averageMonthlySurplus,
    },
    catatan_data: {
      jumlah_transaksi_dibaca: summary.meta.transactionCount,
      jumlah_bulan_data: summary.meta.monthsCovered,
      tanggal_terawal: summary.meta.earliestDate,
      tanggal_terakhir: summary.meta.latestDate,
      terpotong: summary.meta.truncated,
    },
  };
}

// Validasi wajib sebelum ringkasan dikirim ke penyedia AI (FR-08).
export function validateSummaryForAi(payload, { maxChars = 4000 } = {}) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, error: "Ringkasan bukan objek yang valid." };
  }

  const problems = [];
  const walk = (value, path) => {
    if (value === null || value === undefined || typeof value === "boolean") return;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) problems.push(`${path} bukan angka yang valid.`);
      return;
    }
    if (typeof value === "string") {
      if (value.length > 40) problems.push(`${path} berisi teks yang terlalu panjang.`);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${path}[${index}]`));
      return;
    }
    if (typeof value === "object") {
      for (const [key, item] of Object.entries(value)) walk(item, path ? `${path}.${key}` : key);
      return;
    }
    problems.push(`${path} berisi tipe data yang tidak didukung.`);
  };

  walk(payload, "ringkasan");
  if (problems.length > 0) return { ok: false, error: problems[0] };

  let serialized = "";
  try {
    serialized = JSON.stringify(payload);
  } catch {
    return { ok: false, error: "Ringkasan tidak dapat diserialisasi." };
  }
  if (serialized.length > maxChars) {
    return { ok: false, error: `Ringkasan terlalu besar (${serialized.length} karakter).` };
  }

  return { ok: true, serialized, size: serialized.length };
}
