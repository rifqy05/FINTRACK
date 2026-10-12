// Semua rumus keuangan ada di sini. Dashboard, anggaran, dan laporan memanggil
// fungsi yang sama supaya angkanya selalu konsisten.

import { daysInMonth, lastNMonths, monthKeyOf, monthsBetween, shortMonthLabel } from "./dates.js";

export function sumByType(transactions, type) {
  return transactions.reduce((total, t) => (t.type === type ? total + t.amount : total), 0);
}

export const calculateIncome = (transactions) => sumByType(transactions, "income");
export const calculateExpense = (transactions) => sumByType(transactions, "expense");

export function calculateBalance(transactions) {
  return transactions.reduce((balance, transaction) => {
    if (transaction.type === "income") return balance + transaction.amount;
    if (transaction.type === "expense") return balance - transaction.amount;
    return balance;
  }, 0);
}

// (pemasukan - pengeluaran) / pemasukan x 100. Mengembalikan null jika pemasukan nol.
export function calculateSavingRate(income, expense) {
  if (!(income > 0)) return null;
  return ((income - expense) / income) * 100;
}

export function summarize(transactions) {
  const income = calculateIncome(transactions);
  const expense = calculateExpense(transactions);
  return { income, expense, balance: income - expense, savingRate: calculateSavingRate(income, expense) };
}

/* ---------- Periode dan filter ---------- */

export function filterByMonth(transactions, monthKey) {
  return transactions.filter((t) => monthKeyOf(t.date) === monthKey);
}

// period: { type: "all" } atau { type: "month", month: "YYYY-MM" }
export function filterByPeriod(transactions, period) {
  if (period.type === "month") return filterByMonth(transactions, period.month);
  return transactions;
}

// Terbaru di atas. Jika tanggal sama, transaksi yang ditambahkan belakangan tampil lebih dulu.
export function sortNewestFirst(transactions) {
  return transactions
    .map((transaction, index) => ({ transaction, index }))
    .sort((a, b) => {
      if (a.transaction.date !== b.transaction.date) return a.transaction.date < b.transaction.date ? 1 : -1;
      return b.index - a.index;
    })
    .map((entry) => entry.transaction);
}

export const EMPTY_FILTERS = { search: "", dateFrom: "", dateTo: "", type: "", category: "", paymentMethod: "" };

export function filterTransactions(transactions, filters) {
  const f = { ...EMPTY_FILTERS, ...filters };
  const query = f.search.trim().toLowerCase();
  return transactions.filter((t) => {
    if (f.type && t.type !== f.type) return false;
    if (f.category && t.category !== f.category) return false;
    if (f.paymentMethod && t.paymentMethod !== f.paymentMethod) return false;
    if (f.dateFrom && t.date < f.dateFrom) return false;
    if (f.dateTo && t.date > f.dateTo) return false;
    if (query) {
      const haystack = `${t.description} ${t.category} ${t.paymentMethod} ${t.amount}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function hasActiveFilters(filters) {
  return Object.keys(EMPTY_FILTERS).some((key) => (filters[key] ?? "") !== "");
}

/* ---------- Data untuk grafik ---------- */

// Pengeluaran per kategori, terbesar dulu, lengkap dengan persentase dari total.
export function expenseByCategory(transactions) {
  const totals = new Map();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }
  const total = [...totals.values()].reduce((a, b) => a + b, 0);
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount, percent: total > 0 ? (amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

export function monthlyTotals(transactions, monthKeys) {
  return monthKeys.map((month) => {
    const inMonth = filterByMonth(transactions, month);
    return {
      key: month,
      label: shortMonthLabel(month),
      income: calculateIncome(inMonth),
      expense: calculateExpense(inMonth),
    };
  });
}

// Pecah satu bulan menjadi minggu 1 sampai 5 (hari 1-7, 8-14, 15-21, 22-28, 29-akhir).
export function weeklyTotals(transactions, monthKey) {
  const lastDay = daysInMonth(monthKey);
  const buckets = [
    { label: "Minggu 1", from: 1, to: 7 },
    { label: "Minggu 2", from: 8, to: 14 },
    { label: "Minggu 3", from: 15, to: 21 },
    { label: "Minggu 4", from: 22, to: 28 },
    { label: "Minggu 5", from: 29, to: lastDay },
  ].filter((b) => b.from <= lastDay);

  const inMonth = filterByMonth(transactions, monthKey);
  return buckets.map((b) => {
    const inWeek = inMonth.filter((t) => {
      const day = Number(t.date.slice(8, 10));
      return day >= b.from && day <= b.to;
    });
    return { key: b.label, label: b.label, income: calculateIncome(inWeek), expense: calculateExpense(inWeek) };
  });
}

// Seri pemasukan vs pengeluaran mengikuti periode aktif.
// Bulan tertentu: per minggu. Semua data: per bulan dari transaksi pertama sampai terakhir.
export function buildIncomeExpenseSeries(transactions, period) {
  if (period.type === "month") {
    return { unit: "minggu", data: weeklyTotals(transactions, period.month) };
  }
  if (transactions.length === 0) return { unit: "bulan", data: [] };
  const months = transactions.map((t) => monthKeyOf(t.date)).sort();
  return { unit: "bulan", data: monthlyTotals(transactions, monthsBetween(months[0], months[months.length - 1])) };
}

// Saldo kumulatif di akhir tiap bulan (menghitung seluruh transaksi sampai bulan itu).
export function balanceByMonth(allTransactions, monthKeys) {
  return monthKeys.map((month) => {
    const upToMonth = allTransactions.filter((t) => monthKeyOf(t.date) <= month);
    return { key: month, label: shortMonthLabel(month), balance: calculateBalance(upToMonth) };
  });
}

// Bulan tertentu: 6 bulan yang berakhir di bulan itu. Semua data: dari bulan pertama sampai bulan terakhir.
export function buildBalanceTrend(allTransactions, period, todayMonth) {
  if (period.type === "month") {
    return balanceByMonth(allTransactions, lastNMonths(period.month, 6));
  }
  if (allTransactions.length === 0) return [];
  const months = allTransactions.map((t) => monthKeyOf(t.date)).sort();
  const end = months[months.length - 1] > todayMonth ? months[months.length - 1] : todayMonth;
  return balanceByMonth(allTransactions, monthsBetween(months[0], end));
}

/* ---------- Anggaran ---------- */

export const BUDGET_WARNING_THRESHOLD = 80; // persen

// Di bawah 80% normal, 80% sampai kurang dari 100% hampir habis, 100% ke atas melewati batas.
export function budgetStatus(percent) {
  if (percent >= 100) return "over";
  if (percent >= BUDGET_WARNING_THRESHOLD) return "warning";
  return "ok";
}

// Hanya pengeluaran dengan kategori dan bulan yang sama dengan anggaran yang dihitung.
export function calculateBudgetUsage(budget, transactions) {
  const spent = transactions
    .filter((t) => t.type === "expense" && t.category === budget.category && monthKeyOf(t.date) === budget.month)
    .reduce((total, t) => total + t.amount, 0);
  const percent = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
  return { spent, remaining: budget.limit - spent, percent, status: budgetStatus(percent) };
}

export function getBudgetsForMonth(budgets, month) {
  return budgets.filter((b) => b.month === month);
}

export function budgetUsageForMonth(budgets, transactions, month) {
  return getBudgetsForMonth(budgets, month)
    .map((budget) => ({ budget, ...calculateBudgetUsage(budget, transactions) }))
    .sort((a, b) => b.percent - a.percent);
}
