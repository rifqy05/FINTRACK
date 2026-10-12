import { describe, expect, it } from "vitest";
import { parseBackup, validateBudgetInput, validateTransactionInput } from "../src/utils/validation.js";
import { createBackupJson, transactionsToCsv } from "../src/utils/fileExport.js";
import { formatCompact, formatCurrency, formatPercent } from "../src/utils/formatCurrency.js";
import { buildDemoData } from "../src/utils/demoData.js";

const valid = {
  type: "expense",
  date: "2026-10-09",
  category: "Makanan",
  description: "Makan siang",
  amount: "35000",
  paymentMethod: "QRIS",
};

describe("validasi form transaksi", () => {
  it("menerima input yang benar dan mengubah nominal menjadi angka", () => {
    const result = validateTransactionInput(valid);
    expect(result.valid).toBe(true);
    expect(result.clean.amount).toBe(35000);
    expect(typeof result.clean.amount).toBe("number");
  });

  it("keterangan boleh kosong", () => {
    expect(validateTransactionInput({ ...valid, description: "   " }).valid).toBe(true);
  });

  it.each([
    ["", "wajib"],
    ["0", "lebih besar dari nol"],
    ["abc", "angka"],
    ["12.5", "angka"],
    ["-5", "angka"],
    ["9".repeat(15), "terlalu besar"],
  ])("menolak nominal %j", (amount, message) => {
    const result = validateTransactionInput({ ...valid, amount });
    expect(result.valid).toBe(false);
    expect(result.errors.amount).toContain(message);
  });

  it("menolak tanggal kosong, tanggal mustahil, jenis dan kategori yang salah", () => {
    expect(validateTransactionInput({ ...valid, date: "" }).errors.date).toBeTruthy();
    expect(validateTransactionInput({ ...valid, date: "2026-02-31" }).errors.date).toBeTruthy();
    expect(validateTransactionInput({ ...valid, type: "" }).errors.type).toBeTruthy();
    expect(validateTransactionInput({ ...valid, category: "" }).errors.category).toBeTruthy();
    expect(validateTransactionInput({ ...valid, category: "Gaji" }).errors.category).toContain("tidak sesuai");
    expect(validateTransactionInput({ ...valid, paymentMethod: "Cek" }).errors.paymentMethod).toBeTruthy();
  });

  it("membatasi panjang keterangan", () => {
    expect(validateTransactionInput({ ...valid, description: "x".repeat(121) }).errors.description).toBeTruthy();
  });
});

describe("validasi anggaran", () => {
  it("menerima dan menolak dengan benar", () => {
    expect(validateBudgetInput({ month: "2026-10", category: "Makanan", limit: "500000" }).valid).toBe(true);
    expect(validateBudgetInput({ month: "2026-10", category: "Gaji", limit: "500000" }).errors.category).toBeTruthy();
    expect(validateBudgetInput({ month: "2026-13", category: "Makanan", limit: "500000" }).errors.month).toBeTruthy();
    expect(validateBudgetInput({ month: "2026-10", category: "Makanan", limit: "0" }).errors.limit).toBeTruthy();
  });
});

describe("backup JSON", () => {
  const { transactions, budgets } = buildDemoData(new Date(2026, 9, 9));

  it("hasil backup bisa diimport kembali tanpa perubahan", () => {
    const json = createBackupJson(transactions, budgets, new Date("2026-10-09T00:00:00Z"));
    const result = parseBackup(json);
    expect(result.ok).toBe(true);
    expect(result.data.transactions).toEqual(transactions);
    expect(result.data.budgets).toEqual(budgets);
  });

  it.each([
    ["bukan JSON", "{rusak", "JSON"],
    ["array", "[]", "Struktur"],
    ["app lain", JSON.stringify({ app: "lain", version: 1, transactions: [], budgets: [] }), "bukan backup FinTrack"],
    ["versi lain", JSON.stringify({ app: "fintrack", version: 9, transactions: [], budgets: [] }), "Versi"],
    ["tanpa daftar", JSON.stringify({ app: "fintrack", version: 1 }), "daftar"],
  ])("menolak file %s", (_name, text, message) => {
    const result = parseBackup(text);
    expect(result.ok).toBe(false);
    expect(result.error).toContain(message);
  });

  it("menolak transaksi dengan nominal berupa teks berformat", () => {
    const bad = { ...transactions[0], amount: "Rp35.000" };
    const result = parseBackup(JSON.stringify({ app: "fintrack", version: 1, transactions: [bad], budgets: [] }));
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Transaksi ke-1");
  });

  it("menolak id ganda dan anggaran ganda", () => {
    const dup = JSON.stringify({
      app: "fintrack",
      version: 1,
      transactions: [transactions[0], transactions[0]],
      budgets: [],
    });
    expect(parseBackup(dup).error).toContain("id ganda");
    const dupBudget = JSON.stringify({
      app: "fintrack",
      version: 1,
      transactions: [],
      budgets: [budgets[0], budgets[0]],
    });
    expect(parseBackup(dupBudget).error).toContain("ganda");
  });
});

describe("export CSV", () => {
  const base = {
    id: "1",
    date: "2026-10-09",
    type: "expense",
    category: "Makanan",
    amount: 35000,
    paymentMethod: "QRIS",
  };

  it("memakai BOM, header, dan nominal angka polos", () => {
    const csv = transactionsToCsv([{ ...base, description: "Makan siang" }]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    const [header, row] = csv.slice(1).split("\r\n");
    expect(header).toBe("Tanggal;Jenis;Kategori;Keterangan;Jumlah;Metode Pembayaran");
    expect(row).toBe("2026-10-09;Pengeluaran;Makanan;Makan siang;35000;QRIS");
  });

  it("meng-escape titik koma, kutip, dan baris baru", () => {
    const csv = transactionsToCsv([{ ...base, description: 'beli "kopi"; susu\nbaru' }]);
    expect(csv).toContain('"beli ""kopi""; susu\nbaru"');
  });

  it("menetralkan formula injection", () => {
    const csv = transactionsToCsv([{ ...base, description: '=HYPERLINK("http://x")' }]);
    expect(csv).toContain("'=HYPERLINK");
  });

  it("tanpa transaksi tetap menghasilkan header", () => {
    expect(transactionsToCsv([]).slice(1)).toBe("Tanggal;Jenis;Kategori;Keterangan;Jumlah;Metode Pembayaran");
  });
});

describe("format angka", () => {
  const plain = (s) => s.replace(/\u00a0/g, " ");
  it("format Rupiah", () => {
    expect(plain(formatCurrency(35000))).toBe("Rp 35.000");
    expect(plain(formatCurrency(0))).toBe("Rp 0");
    expect(plain(formatCurrency(-1500))).toContain("1.500");
    expect(plain(formatCurrency(NaN))).toBe("Rp 0");
  });
  it("format persen dan singkat", () => {
    expect(formatPercent(null)).toBe("-");
    expect(formatPercent(Infinity)).toBe("-");
    expect(formatPercent(75)).toBe("75%");
    expect(formatCompact(1500000)).toMatch(/1,5/);
  });
});
