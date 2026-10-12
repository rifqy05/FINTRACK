// Data contoh untuk mencoba aplikasi. Tanggal dibuat relatif terhadap hari ini.

import { addMonths, currentMonthKey, todayISO } from "./dates.js";

// [bulan ke belakang, tanggal, jenis, kategori, keterangan, nominal, metode]
const SAMPLE_ROWS = [
  [0, 1, "income", "Gaji", "Uang saku bulanan", 3500000, "Transfer"],
  [0, 2, "expense", "Tagihan", "Kos bulan ini", 1200000, "Transfer"],
  [0, 3, "expense", "Internet", "Paket data", 85000, "E-wallet"],
  [0, 4, "expense", "Makanan", "Makan siang", 35000, "QRIS"],
  [0, 5, "expense", "Transportasi", "Isi saldo kartu KRL", 100000, "Debit"],
  [0, 6, "expense", "Makanan", "Belanja bahan makanan", 210000, "Tunai"],
  [0, 7, "expense", "Hiburan", "Nonton film", 120000, "QRIS"],
  [0, 8, "income", "Freelance", "Desain poster acara", 600000, "Transfer"],
  [0, 9, "expense", "Hiburan", "Langganan streaming", 54000, "Kredit"],
  [1, 1, "income", "Gaji", "Uang saku bulanan", 3500000, "Transfer"],
  [1, 2, "expense", "Tagihan", "Kos bulan ini", 1200000, "Transfer"],
  [1, 3, "expense", "Internet", "Paket data", 85000, "E-wallet"],
  [1, 5, "expense", "Makanan", "Makan bersama teman", 145000, "QRIS"],
  [1, 8, "expense", "Pendidikan", "Fotokopi dan buku", 175000, "Tunai"],
  [1, 12, "expense", "Transportasi", "Ojek online", 64000, "E-wallet"],
  [1, 15, "income", "Bonus", "Honor asisten praktikum", 450000, "Transfer"],
  [1, 18, "expense", "Belanja", "Sepatu", 389000, "Debit"],
  [1, 21, "expense", "Kesehatan", "Obat flu", 47500, "Tunai"],
  [1, 24, "expense", "Makanan", "Belanja mingguan", 260000, "Tunai"],
  [1, 27, "expense", "Hiburan", "Karaoke", 90000, "QRIS"],
  [2, 1, "income", "Gaji", "Uang saku bulanan", 3500000, "Transfer"],
  [2, 2, "expense", "Tagihan", "Kos bulan ini", 1200000, "Transfer"],
  [2, 4, "expense", "Internet", "Paket data", 85000, "E-wallet"],
  [2, 7, "expense", "Makanan", "Makan malam", 52000, "QRIS"],
  [2, 10, "expense", "Keluarga", "Kirim untuk adik", 300000, "Transfer"],
  [2, 14, "income", "Freelance", "Edit video", 800000, "Transfer"],
  [2, 19, "expense", "Transportasi", "Tiket bus pulang", 150000, "Transfer"],
  [2, 23, "expense", "Makanan", "Belanja mingguan", 240000, "Tunai"],
  [2, 26, "expense", "Belanja", "Kaos", 129000, "E-wallet"],
];

export const DEMO_ID_PREFIX = "demo-";

export function buildDemoData(today = new Date()) {
  const thisMonth = currentMonthKey(today);
  const todayText = todayISO(today);

  const transactions = SAMPLE_ROWS.map(([back, day, type, category, description, amount, paymentMethod], index) => {
    const month = addMonths(thisMonth, -back);
    return {
      id: `${DEMO_ID_PREFIX}${index + 1}`,
      date: `${month}-${String(day).padStart(2, "0")}`,
      type,
      category,
      description,
      amount,
      paymentMethod,
    };
  }).filter((t) => t.date <= todayText);

  const budgets = [
    { month: thisMonth, category: "Makanan", limit: 700000 },
    { month: thisMonth, category: "Hiburan", limit: 150000 },
    { month: thisMonth, category: "Transportasi", limit: 400000 },
    { month: thisMonth, category: "Internet", limit: 100000 },
  ];

  return { transactions, budgets };
}
