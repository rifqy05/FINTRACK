// Helper tanggal. Semua tanggal disimpan sebagai teks "YYYY-MM-DD" (waktu lokal)
// dan bulan sebagai "YYYY-MM", supaya tidak terkena masalah zona waktu.

const pad = (n) => String(n).padStart(2, "0");

export function todayISO(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function currentMonthKey(date = new Date()) {
  return todayISO(date).slice(0, 7);
}

export function isValidISODate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function isValidMonthKey(value) {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function monthKeyOf(dateISO) {
  return dateISO.slice(0, 7);
}

function parseMonthKey(key) {
  const [y, m] = key.split("-").map(Number);
  return { year: y, month: m };
}

export function makeMonthKey(year, month) {
  return `${year}-${pad(month)}`;
}

export function addMonths(key, delta) {
  const { year, month } = parseMonthKey(key);
  const index = year * 12 + (month - 1) + delta;
  return makeMonthKey(Math.floor(index / 12), (index % 12) + 1);
}

// Daftar bulan berurutan dari startKey sampai endKey (inklusif).
export function monthsBetween(startKey, endKey) {
  const keys = [];
  let cursor = startKey;
  while (cursor <= endKey) {
    keys.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return keys;
}

// n bulan terakhir yang berakhir di endKey, urut dari lama ke baru.
export function lastNMonths(endKey, n) {
  return Array.from({ length: n }, (_, i) => addMonths(endKey, i - (n - 1)));
}

export function daysInMonth(key) {
  const { year, month } = parseMonthKey(key);
  return new Date(year, month, 0).getDate();
}

export function formatDate(dateISO) {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(y, m - 1, d),
  );
}

export function formatMonthLabel(key) {
  const { year, month } = parseMonthKey(key);
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

export function shortMonthLabel(key) {
  const { year, month } = parseMonthKey(key);
  const name = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(new Date(year, month - 1, 1));
  return `${name} ${String(year).slice(2)}`;
}

export function monthName(month) {
  return new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date(2000, month - 1, 1));
}
