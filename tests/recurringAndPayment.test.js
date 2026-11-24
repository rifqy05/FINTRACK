import { describe, expect, it } from "vitest";
import { summarizeByPaymentMethod } from "../src/utils/financeCalculations.js";
import {
  buildMonthlyRecurringTransactions,
  countPendingRecurringForMonth,
  isRecurringRecordedInMonth,
  validateRecurringInput,
} from "../src/utils/recurring.js";

describe("summarizeByPaymentMethod", () => {
  it("mengelompokkan pemasukan, pengeluaran, arus bersih, dan porsi volume per metode", () => {
    const txs = [
      { id: "1", type: "income", amount: 3000000, paymentMethod: "Transfer" },
      { id: "2", type: "expense", amount: 1200000, paymentMethod: "Transfer" },
      { id: "3", type: "expense", amount: 500000, paymentMethod: "QRIS" },
      { id: "4", type: "expense", amount: 300000, paymentMethod: "QRIS" },
    ];

    const result = summarizeByPaymentMethod(txs);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      method: "Transfer",
      income: 3000000,
      expense: 1200000,
      net: 1800000,
      count: 2,
      volume: 4200000,
    });
    expect(result[0].sharePercent).toBeCloseTo(84, 1);

    expect(result[1]).toMatchObject({
      method: "QRIS",
      income: 0,
      expense: 800000,
      net: -800000,
      count: 2,
      volume: 800000,
    });
    expect(result[1].sharePercent).toBeCloseTo(16, 1);
  });

  it("mengembalikan array kosong jika tidak ada transaksi", () => {
    expect(summarizeByPaymentMethod([])).toEqual([]);
  });
});

describe("recurring templates", () => {
  it("memvalidasi input template rutin dan membatasi tanggal 1..28", () => {
    const valid = validateRecurringInput({
      type: "expense",
      category: "Tagihan",
      amount: "1.200.000",
      description: "Kos bulanan",
      paymentMethod: "Transfer",
      dayOfMonth: "31",
    });
    expect(valid.valid).toBe(true);
    expect(valid.clean).toEqual({
      type: "expense",
      category: "Tagihan",
      amount: 1200000,
      description: "Kos bulanan",
      paymentMethod: "Transfer",
      dayOfMonth: 28,
    });

    const invalid = validateRecurringInput({
      type: "expense",
      category: "Gaji", // kategori pemasukan tidak valid untuk pengeluaran
      amount: "0",
      description: "",
      paymentMethod: "Tunai",
      dayOfMonth: "5",
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.category).toBeTruthy();
    expect(invalid.errors.amount).toBeTruthy();
  });

  it("menghasilkan transaksi rutin bulanan tanpa duplikasi pada bulan yang sama", () => {
    const templates = [
      { id: "r1", type: "income", category: "Gaji", amount: 3500000, description: "Gaji", paymentMethod: "Transfer", dayOfMonth: 1 },
      { id: "r2", type: "expense", category: "Tagihan", amount: 1200000, description: "Kos", paymentMethod: "Transfer", dayOfMonth: 2 },
    ];
    const existing = [
      { id: "t1", date: "2026-11-01", type: "income", category: "Gaji", amount: 3500000, description: "Gaji", paymentMethod: "Transfer" },
    ];

    expect(isRecurringRecordedInMonth(templates[0], "2026-11", existing)).toBe(true);
    expect(isRecurringRecordedInMonth(templates[1], "2026-11", existing)).toBe(false);
    expect(countPendingRecurringForMonth(templates, "2026-11", existing)).toBe(1);

    let seq = 0;
    const generated = buildMonthlyRecurringTransactions(templates, "2026-11", existing, () => `gen-${++seq}`);
    expect(generated).toHaveLength(1);
    expect(generated[0]).toEqual({
      id: "gen-1",
      date: "2026-11-02",
      type: "expense",
      category: "Tagihan",
      amount: 1200000,
      description: "Kos",
      paymentMethod: "Transfer",
    });

    // Untuk bulan lain (Desember), keduanya belum tercatat
    expect(countPendingRecurringForMonth(templates, "2026-12", existing)).toBe(2);
  });
});
