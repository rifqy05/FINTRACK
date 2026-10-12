import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSheetsConfig,
  getSheetsConfig,
  isValidGoogleScriptUrl,
  saveSheetsConfig,
  syncTransactionsToGoogleSheets,
  testSheetsConnection,
} from "../src/services/googleSheetsService.js";

const VALID_URL = "https://script.google.com/macros/s/AKfycbxyz123456789/exec";

describe("googleSheetsService: validasi URL Web App", () => {
  it("menerima URL Google Apps Script Web App yang valid", () => {
    expect(isValidGoogleScriptUrl(VALID_URL)).toBe(true);
    expect(isValidGoogleScriptUrl("  " + VALID_URL + "  ")).toBe(true);
  });

  it("menolak URL yang tidak berakhiran /exec atau bukan script.google.com", () => {
    expect(isValidGoogleScriptUrl("https://script.google.com/macros/s/AKfycbxyz123/edit")).toBe(false);
    expect(isValidGoogleScriptUrl("https://script.google.com/macros/s/AKfycbxyz123/dev")).toBe(false);
    expect(isValidGoogleScriptUrl("https://docs.google.com/spreadsheets/d/12345/edit")).toBe(false);
    expect(isValidGoogleScriptUrl("http://script.google.com/macros/s/123/exec")).toBe(false);
    expect(isValidGoogleScriptUrl("")).toBe(false);
    expect(isValidGoogleScriptUrl(null)).toBe(false);
  });
});

describe("googleSheetsService: pengelolaan konfigurasi lokal", () => {
  beforeEach(() => {
    clearSheetsConfig();
  });

  afterEach(() => {
    clearSheetsConfig();
  });

  it("mengembalikan konfigurasi default saat belum ada data tersimpan", () => {
    const config = getSheetsConfig();
    expect(config.webAppUrl).toBe("");
    expect(config.secretToken).toBe("");
    expect(config.lastSyncAt).toBeNull();
  });

  it("menyimpan dan membaca kembali konfigurasi", () => {
    saveSheetsConfig({
      webAppUrl: VALID_URL,
      secretToken: "rahasia123",
    });

    const saved = getSheetsConfig();
    expect(saved.webAppUrl).toBe(VALID_URL);
    expect(saved.secretToken).toBe("rahasia123");
  });

  it("menghapus konfigurasi dengan clearSheetsConfig", () => {
    saveSheetsConfig({ webAppUrl: VALID_URL });
    clearSheetsConfig();
    expect(getSheetsConfig().webAppUrl).toBe("");
  });
});

describe("googleSheetsService: pengujian koneksi (ping)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("menolak uji koneksi jika URL tidak valid tanpa memanggil fetch", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const res = await testSheetsConnection("invalid-url");
    expect(res.ok).toBe(false);
    expect(res.error).toContain("tidak valid");
    expect(spy).not.toHaveBeenCalled();
  });

  it("menangani respons sukses dari Google Apps Script", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        message: "Koneksi berhasil!",
        spreadsheetTitle: "FinTrack - Rekap Keuangan",
      }),
    });

    const res = await testSheetsConnection(VALID_URL, "token123");
    expect(res.ok).toBe(true);
    expect(res.spreadsheetTitle).toBe("FinTrack - Rekap Keuangan");
  });

  it("menangani respons error dari server Google Apps Script", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: false,
        error: "Akses ditolak: Secret token tidak cocok.",
      }),
    });

    const res = await testSheetsConnection(VALID_URL, "token-salah");
    expect(res.ok).toBe(false);
    expect(res.error).toContain("Secret token tidak cocok");
  });

  it("menangani kegagalan jaringan saat uji koneksi", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network failed"));

    const res = await testSheetsConnection(VALID_URL);
    expect(res.ok).toBe(false);
    expect(res.error).toContain("Gagal terhubung");
  });
});

describe("googleSheetsService: sinkronisasi transaksi", () => {
  beforeEach(() => {
    clearSheetsConfig();
    vi.restoreAllMocks();
  });

  it("mengembalikan error jika Google Sheets belum dikonfigurasi", async () => {
    const res = await syncTransactionsToGoogleSheets([]);
    expect(res.ok).toBe(false);
    expect(res.error).toContain("belum dikonfigurasi");
  });

  it("mengirim transaksi dengan benar dan memperbarui metadata sync", async () => {
    saveSheetsConfig({ webAppUrl: VALID_URL, secretToken: "my-token" });

    const dummyTransactions = [
      {
        id: "tx-1",
        date: "2026-10-12",
        type: "expense",
        category: "Makanan",
        description: "Makan siang",
        amount: 35000,
        paymentMethod: "QRIS",
      },
    ];

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        message: "Sinkronisasi berhasil.",
        stats: {
          totalReceived: 1,
          inserted: 1,
          updated: 0,
          syncedAt: "2026-10-12 10:30:00",
        },
      }),
    });

    const res = await syncTransactionsToGoogleSheets(dummyTransactions);
    expect(res.ok).toBe(true);
    expect(res.stats.inserted).toBe(1);
    expect(res.stats.updated).toBe(0);

    // Verifikasi payload yang dikirim ke Google Apps Script
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const callArgs = fetchSpy.mock.calls[0];
    const payload = JSON.parse(callArgs[1].body);
    expect(payload.action).toBe("sync_transactions");
    expect(payload.secretToken).toBe("my-token");
    expect(payload.transactions).toHaveLength(1);
    expect(payload.transactions[0].id).toBe("tx-1");

    // Verifikasi konfigurasi lokal diperbarui dengan status sukses
    const updatedConfig = getSheetsConfig();
    expect(updatedConfig.lastSyncStatus).toBe("success");
    expect(updatedConfig.lastSyncAt).toBeTruthy();
    expect(updatedConfig.lastSyncStats.totalReceived).toBe(1);
  });
});
