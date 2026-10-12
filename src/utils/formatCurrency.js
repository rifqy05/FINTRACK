// Format angka ke Rupiah. Nominal selalu disimpan sebagai angka, bukan teks.

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const compact = new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 });

export function formatCurrency(amount) {
  const value = Number.isFinite(amount) ? amount : 0;
  return rupiah.format(value);
}

// Versi singkat untuk sumbu grafik, contoh: "1,5 jt".
export function formatCompact(amount) {
  return compact.format(Number.isFinite(amount) ? amount : 0);
}

// Saving rate bisa null (pemasukan nol). Tampilkan "-" supaya tidak muncul NaN/Infinity.
export function formatPercent(value, digits = 0) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return `${value.toFixed(digits)}%`;
}
