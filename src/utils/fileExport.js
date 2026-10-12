// Export CSV dan backup JSON.

import { TYPE_LABELS } from "./constants.js";
import { sortNewestFirst } from "./financeCalculations.js";

const BOM = "\uFEFF"; // supaya Excel membaca UTF-8 dengan benar

// Pemisah kolom titik koma (;) karena itu pemisah bawaan Excel dengan pengaturan wilayah Indonesia.
const DELIMITER = ";";

function csvText(value) {
  let text = String(value ?? "");
  // Cegah formula injection: sel teks yang diawali = + - @ dibaca Excel sebagai rumus.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[;"\n\r]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function transactionsToCsv(transactions) {
  const header = ["Tanggal", "Jenis", "Kategori", "Keterangan", "Jumlah", "Metode Pembayaran"];
  const rows = sortNewestFirst(transactions).map((t) =>
    [
      t.date,
      TYPE_LABELS[t.type],
      csvText(t.category),
      csvText(t.description),
      String(t.amount), // angka polos, tanpa "Rp" dan pemisah ribuan
      csvText(t.paymentMethod),
    ].join(DELIMITER),
  );
  return BOM + [header.join(DELIMITER), ...rows].join("\r\n");
}

export function createBackupJson(transactions, budgets, now = new Date()) {
  return JSON.stringify({ app: "fintrack", version: 1, exportedAt: now.toISOString(), transactions, budgets }, null, 2);
}

export function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
