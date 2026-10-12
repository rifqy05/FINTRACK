import { describe, expect, it } from "vitest";
import {
  budgetStatus,
  buildBalanceTrend,
  buildIncomeExpenseSeries,
  calculateBalance,
  calculateBudgetUsage,
  calculateSavingRate,
  expenseByCategory,
  filterByMonth,
  filterTransactions,
  sortNewestFirst,
  summarize,
  weeklyTotals,
} from "../src/utils/financeCalculations.js";
import { addMonths, daysInMonth, isValidISODate, lastNMonths, monthsBetween } from "../src/utils/dates.js";
import { buildDemoData } from "../src/utils/demoData.js";

const tx = (over) => ({
  id: Math.random().toString(36).slice(2),
  date: "2026-10-05",
  type: "expense",
  category: "Makanan",
  description: "",
  amount: 10000,
  paymentMethod: "Tunai",
  ...over,
});

describe("perhitungan dasar", () => {
  it("menangani array kosong", () => {
    expect(calculateBalance([])).toBe(0);
    expect(summarize([])).toEqual({ income: 0, expense: 0, balance: 0, savingRate: null });
  });

  it("saldo = pemasukan - pengeluaran", () => {
    const list = [tx({ type: "income", amount: 5000000 }), tx({ amount: 35000 }), tx({ amount: 15000 })];
    const s = summarize(list);
    expect(s.income).toBe(5000000);
    expect(s.expense).toBe(50000);
    expect(s.balance).toBe(4950000);
    expect(s.balance).toBe(calculateBalance(list));
  });

  it("saving rate tidak pernah NaN atau Infinity", () => {
    expect(calculateSavingRate(0, 0)).toBeNull();
    expect(calculateSavingRate(0, 5000)).toBeNull();
    expect(calculateSavingRate(1000, 250)).toBe(75);
    expect(calculateSavingRate(1000, 1500)).toBe(-50);
  });
});

describe("filter dan urutan", () => {
  const list = [
    tx({ id: "a", date: "2026-09-30", description: "Makan siang", amount: 30000 }),
    tx({ id: "b", date: "2026-10-01", type: "income", category: "Gaji", amount: 3000000, paymentMethod: "Transfer" }),
    tx({ id: "c", date: "2026-10-01", category: "Internet", description: "Paket data", paymentMethod: "E-wallet" }),
  ];

  it("filter bulan memakai kunci YYYY-MM", () => {
    expect(filterByMonth(list, "2026-10").map((t) => t.id)).toEqual(["b", "c"]);
  });

  it("urut terbaru di atas, tanggal sama: yang ditambah belakangan dulu", () => {
    expect(sortNewestFirst(list).map((t) => t.id)).toEqual(["c", "b", "a"]);
  });

  it("pencarian dan kombinasi filter", () => {
    expect(filterTransactions(list, { search: "paket" }).map((t) => t.id)).toEqual(["c"]);
    expect(filterTransactions(list, { type: "income" }).map((t) => t.id)).toEqual(["b"]);
    expect(filterTransactions(list, { paymentMethod: "E-wallet" }).map((t) => t.id)).toEqual(["c"]);
    expect(filterTransactions(list, { dateFrom: "2026-10-01", dateTo: "2026-10-01" })).toHaveLength(2);
    expect(filterTransactions(list, { category: "Gaji", type: "expense" })).toHaveLength(0);
  });
});

describe("anggaran", () => {
  it("batas status: 80% hampir, 100% lewat", () => {
    expect(budgetStatus(0)).toBe("ok");
    expect(budgetStatus(79.99)).toBe("ok");
    expect(budgetStatus(80)).toBe("warning");
    expect(budgetStatus(99.99)).toBe("warning");
    expect(budgetStatus(100)).toBe("over");
    expect(budgetStatus(250)).toBe("over");
  });

  it("hanya menghitung kategori dan bulan yang cocok", () => {
    const budget = { month: "2026-10", category: "Makanan", limit: 100000 };
    const list = [
      tx({ amount: 40000 }),
      tx({ amount: 20000, date: "2026-10-31" }),
      tx({ amount: 99999, date: "2026-09-30" }), // bulan lain
      tx({ amount: 99999, category: "Hiburan" }), // kategori lain
      tx({ amount: 99999, type: "income", category: "Makanan" }), // bukan pengeluaran
    ];
    const usage = calculateBudgetUsage(budget, list);
    expect(usage.spent).toBe(60000);
    expect(usage.remaining).toBe(40000);
    expect(usage.percent).toBe(60);
    expect(usage.status).toBe("ok");
  });

  it("sisa anggaran bisa negatif saat melewati batas", () => {
    const usage = calculateBudgetUsage({ month: "2026-10", category: "Makanan", limit: 10000 }, [
      tx({ amount: 15000 }),
    ]);
    expect(usage.remaining).toBe(-5000);
    expect(usage.status).toBe("over");
  });
});

describe("data grafik", () => {
  it("pengeluaran per kategori terurut dan persentasenya 100", () => {
    const rows = expenseByCategory([
      tx({ amount: 30000 }),
      tx({ amount: 70000, category: "Hiburan" }),
      tx({ type: "income", category: "Gaji", amount: 999999 }),
    ]);
    expect(rows.map((r) => r.category)).toEqual(["Hiburan", "Makanan"]);
    expect(rows[0].percent).toBe(70);
    expect(rows.reduce((a, r) => a + r.percent, 0)).toBeCloseTo(100);
  });

  it("minggu 1-5 mencakup semua hari dalam bulan", () => {
    const list = [
      tx({ date: "2026-10-01" }),
      tx({ date: "2026-10-07" }),
      tx({ date: "2026-10-29" }),
      tx({ date: "2026-10-31" }),
    ];
    const weeks = weeklyTotals(list, "2026-10");
    expect(weeks).toHaveLength(5);
    expect(weeks[0].expense).toBe(20000);
    expect(weeks[4].expense).toBe(20000);
    expect(weeks.reduce((a, w) => a + w.expense, 0)).toBe(40000);
  });

  it("Februari non-kabisat hanya 4 minggu", () => {
    expect(weeklyTotals([], "2027-02")).toHaveLength(4);
  });

  it("seri pemasukan vs pengeluaran mengikuti periode", () => {
    const list = [tx({ date: "2026-08-10", amount: 1000 }), tx({ date: "2026-10-10", amount: 2000 })];
    const all = buildIncomeExpenseSeries(list, { type: "all" });
    expect(all.unit).toBe("bulan");
    expect(all.data.map((d) => d.expense)).toEqual([1000, 0, 2000]); // Agustus, September kosong, Oktober
    const month = buildIncomeExpenseSeries(list, { type: "month", month: "2026-10" });
    expect(month.unit).toBe("minggu");
    expect(month.data.reduce((a, d) => a + d.expense, 0)).toBe(2000);
    expect(buildIncomeExpenseSeries([], { type: "all" }).data).toEqual([]);
  });

  it("tren saldo bersifat kumulatif", () => {
    const list = [
      tx({ type: "income", category: "Gaji", amount: 1000, date: "2026-08-01" }),
      tx({ amount: 300, date: "2026-09-15" }),
      tx({ amount: 100, date: "2026-10-02" }),
    ];
    const trend = buildBalanceTrend(list, { type: "month", month: "2026-10" }, "2026-10");
    expect(trend).toHaveLength(6);
    expect(trend.at(-1).balance).toBe(600);
    expect(trend.at(-2).balance).toBe(700);
    expect(trend[0].balance).toBe(0); // Mei 2026, sebelum transaksi pertama
    const all = buildBalanceTrend(list, { type: "all" }, "2026-10");
    expect(all.map((p) => p.balance)).toEqual([1000, 700, 600]);
  });
});

describe("tanggal", () => {
  it("validasi tanggal kalender", () => {
    expect(isValidISODate("2026-02-28")).toBe(true);
    expect(isValidISODate("2026-02-30")).toBe(false);
    expect(isValidISODate("2028-02-29")).toBe(true);
    expect(isValidISODate("2026-13-01")).toBe(false);
    expect(isValidISODate("10/09/2026")).toBe(false);
  });

  it("aritmetika bulan melewati pergantian tahun", () => {
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(lastNMonths("2026-02", 3)).toEqual(["2025-12", "2026-01", "2026-02"]);
    expect(monthsBetween("2026-11", "2027-01")).toEqual(["2026-11", "2026-12", "2027-01"]);
    expect(daysInMonth("2028-02")).toBe(29);
  });
});

describe("data demo", () => {
  it("valid, tidak ada tanggal di masa depan, id unik", () => {
    const { transactions, budgets } = buildDemoData(new Date(2026, 9, 9));
    expect(transactions.length).toBeGreaterThan(10);
    expect(transactions.every((t) => t.date <= "2026-10-09")).toBe(true);
    expect(new Set(transactions.map((t) => t.id)).size).toBe(transactions.length);
    expect(budgets.every((b) => b.month === "2026-10")).toBe(true);
  });
});
