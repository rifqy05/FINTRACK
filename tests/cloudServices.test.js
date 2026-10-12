import { describe, expect, it } from "vitest";
import {
  isValidUuid,
  toDeterministicUuid,
  mapTransactionFromDb,
  mapTransactionToDb,
  mapBudgetFromDb,
  mapBudgetToDb,
} from "../src/services/dataMappers.js";
import { getLocalDataToMigrate } from "../src/services/migrationService.js";
import { isSupabaseConfigured } from "../src/services/supabaseClient.js";
import { createTransaction, fetchTransactions } from "../src/services/transactionService.js";
import { fetchBudgets, saveBudget } from "../src/services/budgetService.js";

describe("dataMappers: validasi dan konversi UUID", () => {
  it("mengenali UUID standar yang valid", () => {
    expect(isValidUuid("c7b744a4-569d-4e9d-9cf9-fb1d32d79c65")).toBe(true);
    expect(isValidUuid("00000000-0000-4000-8000-000000000000")).toBe(true);
    expect(isValidUuid("invalid-uuid-string")).toBe(false);
    expect(isValidUuid("demo-1")).toBe(false);
    expect(isValidUuid("")).toBe(false);
    expect(isValidUuid(null)).toBe(false);
  });

  it("mempertahankan UUID yang sudah valid", () => {
    const valid = "c7b744a4-569d-4e9d-9cf9-fb1d32d79c65";
    expect(toDeterministicUuid(valid)).toBe(valid.toLowerCase());
  });

  it("mengonversi ID non-UUID menjadi UUID yang valid dan deterministik (idempoten)", () => {
    const legacyId = "demo-1";
    const uuid1 = toDeterministicUuid(legacyId);
    const uuid2 = toDeterministicUuid(legacyId);

    // Harus berupa UUID yang valid
    expect(isValidUuid(uuid1)).toBe(true);
    // Harus deterministik: pemanggilan ulang menghasilkan UUID yang sama persis
    expect(uuid1).toBe(uuid2);

    // ID legacy yang berbeda menghasilkan UUID yang berbeda
    const uuidOther = toDeterministicUuid("demo-2");
    expect(isValidUuid(uuidOther)).toBe(true);
    expect(uuid1).not.toBe(uuidOther);
  });
});

describe("dataMappers: pemetaan model Transaksi dan Anggaran", () => {
  it("memetakan row transaksi dari database ke model domain aplikasi", () => {
    const dbRow = {
      id: "c7b744a4-569d-4e9d-9cf9-fb1d32d79c65",
      user_id: "user-123",
      type: "expense",
      category: "Makanan",
      amount: "45000",
      date: "2026-10-12T00:00:00Z",
      description: "Makan siang",
      payment_method: "QRIS",
    };

    const domain = mapTransactionFromDb(dbRow);
    expect(domain).toEqual({
      id: "c7b744a4-569d-4e9d-9cf9-fb1d32d79c65",
      date: "2026-10-12",
      type: "expense",
      category: "Makanan",
      description: "Makan siang",
      amount: 45000,
      paymentMethod: "QRIS",
    });
    expect(typeof domain.amount).toBe("number");
  });

  it("memetakan transaksi domain ke payload database", () => {
    const domainTx = {
      id: "c7b744a4-569d-4e9d-9cf9-fb1d32d79c65",
      date: "2026-10-12",
      type: "income",
      category: "Gaji",
      description: " Gaji bulanan  ",
      amount: 5000000,
      paymentMethod: "Transfer",
    };

    const payload = mapTransactionToDb(domainTx, "user-uuid-1");
    expect(payload).toEqual({
      id: "c7b744a4-569d-4e9d-9cf9-fb1d32d79c65",
      user_id: "user-uuid-1",
      type: "income",
      category: "Gaji",
      amount: 5000000,
      date: "2026-10-12",
      description: "Gaji bulanan",
      payment_method: "Transfer",
    });
  });

  it("memetakan anggaran antara database dan model domain", () => {
    const dbBudget = {
      id: "b1b744a4-569d-4e9d-9cf9-fb1d32d79c65",
      user_id: "user-1",
      month: "2026-10",
      category: "Makanan",
      limit_amount: 500000,
    };
    const domainBudget = mapBudgetFromDb(dbBudget);
    expect(domainBudget).toEqual({
      id: "b1b744a4-569d-4e9d-9cf9-fb1d32d79c65",
      month: "2026-10",
      category: "Makanan",
      limit: 500000,
    });

    const payload = mapBudgetToDb({ month: "2026-10", category: "Makanan", limit: 600000 }, "user-1");
    expect(payload.limit_amount).toBe(600000);
    expect(payload.month).toBe("2026-10");
    expect(payload.user_id).toBe("user-1");
  });
});

describe("migrationService: pemeriksaan data lokal", () => {
  it("membaca status data lokal tanpa error", () => {
    const summary = getLocalDataToMigrate();
    expect(typeof summary.hasData).toBe("boolean");
    expect(typeof summary.transactionCount).toBe("number");
    expect(typeof summary.budgetCount).toBe("number");
    expect(Array.isArray(summary.transactions)).toBe(true);
    expect(Array.isArray(summary.budgets)).toBe(true);
  });
});

describe("penanganan error pada service saat sesi kosong", () => {
  it("mengekspor status konfigurasi Supabase berupa boolean", () => {
    expect(typeof isSupabaseConfigured).toBe("boolean");
  });

  it("mengembalikan pesan error yang jelas jika userId kosong", async () => {
    const txRes = await fetchTransactions(null);
    expect(txRes.ok).toBe(false);
    expect(txRes.error).toContain("tidak tersedia");

    const addRes = await createTransaction({}, null);
    expect(addRes.ok).toBe(false);

    const bgRes = await fetchBudgets(null);
    expect(bgRes.ok).toBe(false);

    const saveBgRes = await saveBudget({}, null);
    expect(saveBgRes.ok).toBe(false);
  });
});
