// Konstanta aplikasi: kategori, metode pembayaran, key localStorage.
// Nilai internal jenis transaksi selalu "income" dan "expense".

export const INCOME_CATEGORIES = ["Gaji", "Bonus", "Freelance", "Investasi", "Hadiah", "Lainnya"];

export const EXPENSE_CATEGORIES = [
  "Makanan",
  "Transportasi",
  "Belanja",
  "Tagihan",
  "Hiburan",
  "Kesehatan",
  "Pendidikan",
  "Internet",
  "Keluarga",
  "Lainnya",
];

export const PAYMENT_METHODS = ["Tunai", "Transfer", "Debit", "Kredit", "QRIS", "E-wallet", "Lainnya"];

export const TYPE_LABELS = { income: "Pemasukan", expense: "Pengeluaran" };

export const STORAGE_KEYS = {
  transactions: "fintrack_transactions_v1",
  budgets: "fintrack_budgets_v1",
  theme: "fintrack_theme_v1",
};

export const MAX_AMOUNT = 1_000_000_000_000; // 1 triliun Rupiah, batas wajar untuk input
export const MAX_DESCRIPTION_LENGTH = 120;

export function categoriesFor(type) {
  if (type === "income") return INCOME_CATEGORIES;
  if (type === "expense") return EXPENSE_CATEGORIES;
  return [];
}

// Warna kategori pengeluaran mengikuti urutan daftar, jadi kategori yang sama
// selalu berwarna sama di seluruh grafik. Nilai warna ada di index.css (--cat-1 ... --cat-10).
export function categoryColor(category) {
  const index = EXPENSE_CATEGORIES.indexOf(category);
  return `var(--cat-${index === -1 ? 10 : index + 1})`;
}
