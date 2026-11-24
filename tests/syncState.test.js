import { describe, expect, it } from "vitest";
import { formatSyncTime, describeSync } from "../src/utils/syncState.js";

// Waktu tetap supaya hasilnya tidak bergantung pada jam mesin saat tes dijalankan.
const NOW = new Date(2026, 9, 15, 9, 31, 0); // 15 Oktober 2026, 09:31 waktu lokal

function isoAt(year, monthIndex, day, hour, minute) {
  return new Date(year, monthIndex, day, hour, minute, 0).toISOString();
}

describe("syncState: formatSyncTime", () => {
  it("mengembalikan string kosong bila tidak ada waktu atau waktunya tidak valid", () => {
    expect(formatSyncTime(null, NOW)).toBe("");
    expect(formatSyncTime("", NOW)).toBe("");
    expect(formatSyncTime("bukan-tanggal", NOW)).toBe("");
  });

  it("hanya menampilkan jam untuk waktu di hari yang sama", () => {
    expect(formatSyncTime(isoAt(2026, 9, 15, 9, 31), NOW)).toBe("09.31");
    expect(formatSyncTime(isoAt(2026, 9, 15, 0, 5), NOW)).toBe("00.05");
  });

  it("menambahkan tanggal untuk hari lain dan tahun untuk tahun lain", () => {
    expect(formatSyncTime(isoAt(2026, 9, 12, 14, 5), NOW)).toBe("12 Okt 14.05");
    expect(formatSyncTime(isoAt(2025, 11, 31, 23, 59), NOW)).toBe("31 Des 2025 23.59");
  });
});

describe("syncState: describeSync", () => {
  it("mode lokal punya nada netral dan tidak bisa dicoba ulang", () => {
    const result = describeSync("local");
    expect(result.tone).toBe("neutral");
    expect(result.retryable).toBe(false);
    expect(result.detail).toContain("tersimpan di perangkat");
  });

  it("status tersimpan menyertakan waktu simpan terakhir", () => {
    const result = describeSync("saved", { lastSavedAt: isoAt(2026, 9, 15, 9, 31) });
    expect(result.tone).toBe("ok");
    expect(result.retryable).toBe(false);
    expect(result.detail).toContain("09.31");
  });

  it("status tersimpan tanpa waktu tetap memberi label tanpa keterangan jam", () => {
    const result = describeSync("saved");
    expect(result.label).toBe("Tersimpan");
    expect(result.detail).toBe("");
  });

  it("status offline bisa dicoba ulang dan menjelaskan data tetap aman", () => {
    const result = describeSync("offline");
    expect(result.tone).toBe("warn");
    expect(result.retryable).toBe(true);
    expect(result.detail).toContain("offline");
  });

  it("status gagal menampilkan pesan error dan bisa dicoba ulang", () => {
    const result = describeSync("error", { error: "Gagal terhubung ke Supabase." });
    expect(result.tone).toBe("bad");
    expect(result.retryable).toBe(true);
    expect(result.detail).toBe("Gagal terhubung ke Supabase.");
  });

  it("status tidak dikenal jatuh ke mode lokal, bukan error", () => {
    const result = describeSync("entah");
    expect(result.label).toBe("Mode lokal");
    expect(result.tone).toBe("neutral");
  });
});
