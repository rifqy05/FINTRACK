import { describe, expect, it } from "vitest";
import {
  buildFinanceSummary,
  buildSavingsPlan,
  categoryChanges,
  extractTargetAmount,
  savingsBaseline,
  toAiPayload,
  validateSummaryForAi,
} from "../src/utils/financeSummary.js";

// Data dummy, tanpa data keuangan nyata.
const TODAY = new Date(2026, 9, 12); // 12 Oktober 2026

function dummyTransactions() {
  return [
    {
      id: "t-1",
      date: "2026-10-01",
      type: "income",
      category: "Gaji",
      amount: 8_000_000,
      description: "RAHASIA gaji",
      paymentMethod: "Transfer",
    },
    {
      id: "t-2",
      date: "2026-10-05",
      type: "expense",
      category: "Makanan",
      amount: 1_200_000,
      description: "RAHASIA makan",
      paymentMethod: "QRIS",
    },
    {
      id: "t-3",
      date: "2026-10-06",
      type: "expense",
      category: "Transportasi",
      amount: 400_000,
      description: "",
      paymentMethod: "Tunai",
    },
    {
      id: "t-4",
      date: "2026-09-02",
      type: "income",
      category: "Gaji",
      amount: 8_000_000,
      description: "",
      paymentMethod: "Transfer",
    },
    {
      id: "t-5",
      date: "2026-09-20",
      type: "expense",
      category: "Makanan",
      amount: 900_000,
      description: "",
      paymentMethod: "Tunai",
    },
  ];
}

function dummyBudgets() {
  return [{ id: "b-1", month: "2026-10", category: "Makanan", limit: 1_500_000 }];
}

function summaryFor(month = "2026-10") {
  return buildFinanceSummary({
    transactions: dummyTransactions(),
    budgets: dummyBudgets(),
    month,
    today: TODAY,
  });
}

describe("buildFinanceSummary: angka dasar periode", () => {
  it("menghitung pemasukan, pengeluaran, selisih, dan saving rate bulan ini", () => {
    const summary = summaryFor();
    expect(summary.hasData).toBe(true);
    expect(summary.period.month).toBe("2026-10");
    expect(summary.totals.income).toBe(8_000_000);
    expect(summary.totals.expense).toBe(1_600_000);
    expect(summary.totals.balance).toBe(6_400_000);
    expect(summary.totals.savingRate).toBe(80);
    expect(summary.totals.transactionCount).toBe(3);
  });

  it("menghitung pembanding bulan sebelumnya dan perubahannya", () => {
    const summary = summaryFor();
    expect(summary.period.comparedMonth).toBe("2026-09");
    expect(summary.hasPreviousData).toBe(true);
    expect(summary.previous.expense).toBe(900_000);
    expect(summary.change.expenseDelta).toBe(700_000);
    expect(summary.change.expensePercent).toBeCloseTo(77.78, 2);
    expect(summary.change.incomePercent).toBe(0);
  });

  it("mengurutkan kategori pengeluaran terbesar beserta porsinya", () => {
    const summary = summaryFor();
    expect(summary.topExpenseCategories.map((entry) => entry.category)).toEqual(["Makanan", "Transportasi"]);
    expect(summary.topExpenseCategories[0].amount).toBe(1_200_000);
    expect(summary.topExpenseCategories[0].percent).toBe(75);
  });

  it("menandai kategori yang paling meningkat dan menurun", () => {
    const summary = summaryFor();
    // Transportasi naik 400.000 (dari nol), Makanan naik 300.000
    expect(summary.risingCategories[0]).toMatchObject({ category: "Transportasi", delta: 400_000 });
    expect(summary.risingCategories[0].percentChange).toBeNull(); // pembagi nol, bukan Infinity
    expect(summary.risingCategories[1]).toMatchObject({ category: "Makanan", delta: 300_000 });
    expect(summary.fallingCategories).toEqual([]);
  });

  it("menghitung pemakaian anggaran bulan ini", () => {
    const summary = summaryFor();
    expect(summary.budgets).toHaveLength(1);
    expect(summary.budgets[0]).toMatchObject({
      category: "Makanan",
      limit: 1_500_000,
      spent: 1_200_000,
      remaining: 300_000,
      percent: 80,
      status: "warning",
    });
  });
});

describe("buildFinanceSummary: kasus batas", () => {
  it("mengembalikan angka nol dan hasDatafalse untuk periode tanpa transaksi", () => {
    const summary = buildFinanceSummary({
      transactions: dummyTransactions(),
      budgets: [],
      month: "2026-07",
      today: TODAY,
    });
    expect(summary.hasData).toBe(false);
    expect(summary.totals.income).toBe(0);
    expect(summary.totals.expense).toBe(0);
    expect(summary.totals.balance).toBe(0);
    expect(summary.totals.savingRate).toBeNull(); // pemasukan nol, bukan NaN/Infinity
    expect(summary.topExpenseCategories).toEqual([]);
    expect(summary.budgets).toEqual([]);
  });

  it("tidak mencampur transaksi tepat di batas bulan", () => {
    const transactions = [
      { id: "x-1", date: "2026-09-30", type: "expense", category: "Makanan", amount: 100_000 },
      { id: "x-2", date: "2026-10-01", type: "expense", category: "Makanan", amount: 200_000 },
    ];
    const september = buildFinanceSummary({ transactions, month: "2026-09", today: TODAY });
    const october = buildFinanceSummary({ transactions, month: "2026-10", today: TODAY });

    expect(september.totals.expense).toBe(100_000);
    expect(september.totals.transactionCount).toBe(1);
    expect(october.totals.expense).toBe(200_000);
    expect(october.totals.transactionCount).toBe(1);
  });

  it("tetap akurat untuk nominal sangat besar", () => {
    const transactions = [
      { id: "big-1", date: "2026-10-02", type: "income", category: "Investasi", amount: 999_999_999_999 },
      { id: "big-2", date: "2026-10-03", type: "expense", category: "Tagihan", amount: 999_999_999 },
    ];
    const summary = buildFinanceSummary({ transactions, month: "2026-10", today: TODAY });
    expect(summary.totals.balance).toBe(999_999_999_999 - 999_999_999);
    expect(summary.totals.savingRate).toBeGreaterThan(99);
    expect(Number.isInteger(summary.totals.balance)).toBe(true);
  });

  it("mengabaikan bulan kosong saat menghitung rata-rata bulanan", () => {
    const baseline = savingsBaseline(dummyTransactions(), ["2026-09", "2026-08", "2026-07"]);
    expect(baseline.monthsUsed).toBe(1); // hanya September yang berisi data
    expect(baseline.averageIncome).toBe(8_000_000);
    expect(baseline.averageExpense).toBe(900_000);
    expect(baseline.averageMonthlySurplus).toBe(7_100_000);
  });

  it("melaporkan keterbatasan data pada catatan ringkasan", () => {
    const summary = buildFinanceSummary({
      transactions: dummyTransactions(),
      month: "2026-10",
      today: TODAY,
      truncated: true,
    });
    expect(summary.meta.truncated).toBe(true);
    expect(summary.meta.monthsCovered).toBe(2);
    expect(summary.meta.earliestDate).toBe("2026-09-02");
    expect(summary.meta.latestDate).toBe("2026-10-06");
  });

  it("tidak mengembalikan nilai pecahan pada persentase kategori", () => {
    const transactions = [
      { id: "p-1", date: "2026-10-01", type: "expense", category: "Makanan", amount: 1 },
      { id: "p-2", date: "2026-10-01", type: "expense", category: "Belanja", amount: 2 },
      { id: "p-3", date: "2026-10-01", type: "expense", category: "Hiburan", amount: 3 },
    ];
    const summary = buildFinanceSummary({ transactions, month: "2026-10", today: TODAY });
    for (const entry of summary.topExpenseCategories) {
      expect(entry.percent.toString()).not.toMatch(/\d{5,}/);
    }
  });
});

describe("categoryChanges", () => {
  it("hanya menampilkan kategori yang berubah", () => {
    const current = [
      { category: "Makanan", amount: 500, type: "expense" },
      { category: "Belanja", amount: 100, type: "expense" },
    ];
    const previous = [
      { category: "Makanan", amount: 300, type: "expense" },
      { category: "Belanja", amount: 100, type: "expense" },
      { category: "Hiburan", amount: 200, type: "expense" },
    ];
    const changes = categoryChanges(current, previous, "expense");
    expect(changes.map((entry) => entry.category)).toEqual(["Makanan", "Hiburan"]);
    expect(changes[1]).toMatchObject({ category: "Hiburan", amount: 0, previousAmount: 200, delta: -200 });
  });
});

describe("extractTargetAmount: angka dari pertanyaan pengguna", () => {
  it("mengenali format umum tanpa menebak", () => {
    expect(extractTargetAmount("Saya ingin menabung 5 juta")).toBe(5_000_000);
    expect(extractTargetAmount("target Rp2.500.000")).toBe(2_500_000);
    expect(extractTargetAmount("nabung 500rb dulu")).toBe(500_000);
    expect(extractTargetAmount("1,5 juta per bulan")).toBe(1_500_000);
    expect(extractTargetAmount("10.000")).toBe(10_000);
    expect(extractTargetAmount("menabung 2 miliar")).toBe(2_000_000_000);
  });

  it("mengembalikan null jika tidak ada angka atau di luar batas wajar", () => {
    expect(extractTargetAmount("bagaimana status anggaran saya?")).toBeNull();
    expect(extractTargetAmount("")).toBeNull();
    expect(extractTargetAmount(null)).toBeNull();
    expect(extractTargetAmount("menabung 9.999 triliun")).toBeNull(); // di atas batas 1 triliun
    // Hindari false-positive untuk angka non-nominal (peringkat, durasi bulan, persentase)
    expect(extractTargetAmount("Top 5 pengeluaran bulan ini")).toBeNull();
    expect(extractTargetAmount("Bandingkan 3 bulan terakhir")).toBeNull();
    expect(extractTargetAmount("Bagaimana status anggaran 80%?")).toBeNull();
  });
});

describe("buildSavingsPlan: simulasi menabung deterministik", () => {
  it("menghitung jumlah bulan dari surplus rata-rata aplikasi", () => {
    const plan = buildSavingsPlan({
      savings: { averageMonthlySurplus: 2_000_000, averageExpense: 3_000_000, monthsUsed: 3 },
      targetAmount: 5_000_000,
    });
    expect(plan).toMatchObject({
      targetAmount: 5_000_000,
      monthlySurplus: 2_000_000,
      monthsNeeded: 3,
      achievable: true,
    });
  });

  it("menandai target yang belum bisa diproyeksikan saat rata-rata tidak surplus", () => {
    const plan = buildSavingsPlan({
      savings: { averageMonthlySurplus: -500_000, averageExpense: 3_000_000, monthsUsed: 2 },
      targetAmount: 5_000_000,
    });
    expect(plan.achievable).toBe(false);
    expect(plan.monthsNeeded).toBeNull();
  });

  it("mengembalikan null untuk target yang tidak valid", () => {
    expect(buildSavingsPlan({ savings: { averageMonthlySurplus: 100 }, targetAmount: 0 })).toBeNull();
    expect(buildSavingsPlan({ savings: null, targetAmount: 1_000 })).toBeNull();
  });
});

describe("toAiPayload: data yang boleh dikirim ke penyedia AI", () => {
  it("hanya berisi angka agregat tanpa id dan tanpa keterangan transaksi", () => {
    const payload = toAiPayload(summaryFor());
    const serialized = JSON.stringify(payload);

    expect(serialized).not.toContain("RAHASIA");
    expect(serialized).not.toContain("t-1");
    expect(serialized).not.toContain("b-1");
    expect(serialized).not.toContain("description");
    expect(serialized).not.toContain("paymentMethod");

    expect(payload.ringkasan_bulan_ini.pemasukan).toBe(8_000_000);
    expect(payload.kategori_pengeluaran_teratas[0].category).toBe("Makanan");
    expect(payload.anggaran[0].category).toBe("Makanan");
  });

  it("mengembalikan null jika ringkasan tidak ada", () => {
    expect(toAiPayload(null)).toBeNull();
  });
});

describe("validateSummaryForAi: pemeriksaan sebelum dikirim ke AI", () => {
  it("meloloskan ringkasan normal dan melaporkan ukurannya", () => {
    const result = validateSummaryForAi(toAiPayload(summaryFor()));
    expect(result.ok).toBe(true);
    expect(result.size).toBeGreaterThan(0);
    expect(result.size).toBeLessThanOrEqual(4000);
  });

  it("menolak ringkasan yang berisi teks panjang (indikasi kebocoran data mentah)", () => {
    const payload = toAiPayload(summaryFor());
    payload.kategori_pengeluaran_teratas[0].category = "x".repeat(120);
    const result = validateSummaryForAi(payload);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("terlalu panjang");
  });

  it("menolak angka yang tidak valid (NaN/Infinity)", () => {
    const payload = toAiPayload(summaryFor());
    payload.ringkasan_bulan_ini.pengeluaran = Number.NaN;
    expect(validateSummaryForAi(payload).ok).toBe(false);

    payload.ringkasan_bulan_ini.pengeluaran = Number.POSITIVE_INFINITY;
    expect(validateSummaryForAi(payload).ok).toBe(false);
  });

  it("menolak input yang bukan objek dan ringkasan yang terlalu besar", () => {
    expect(validateSummaryForAi(null).ok).toBe(false);
    expect(validateSummaryForAi([]).ok).toBe(false);

    const payload = toAiPayload(summaryFor());
    payload.kategori_meningkat = Array.from({ length: 60 }, (_, index) => ({
      category: `Kategori ${index}`,
      amount: index,
    }));
    const result = validateSummaryForAi(payload, { maxChars: 200 });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("terlalu besar");
  });
});
