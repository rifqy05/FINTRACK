export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(str) {
  return typeof str === "string" && UUID_REGEX.test(str);
}

/**
 * Mengubah string ID non-UUID (seperti "demo-1" atau "tx-...") menjadi UUID yang deterministik
 * sehingga aman dimasukkan ke kolom UUID PostgreSQL tanpa duplikasi saat migrasi berulang.
 */
export function toDeterministicUuid(id) {
  if (isValidUuid(id)) return id.toLowerCase();

  const text = String(id || "");
  let h1 = 0xdeadbeef ^ text.length;
  let h2 = 0x41c6ce57;
  let h3 = 0x9e3779b9;
  let h4 = 0x7b5d6e2a;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }

  const toHex = (n) => (n >>> 0).toString(16).padStart(8, "0");
  const hex = `${toHex(h1)}${toHex(h2)}${toHex(h3)}${toHex(h4)}`;

  // Format: 8-4-4-4-12, dengan bit version 4 dan variant RFC4122
  const p1 = hex.slice(0, 8);
  const p2 = hex.slice(8, 12);
  const p3 = `4${hex.slice(13, 16)}`;
  const variantNibble = (parseInt(hex[16], 16) & 0x3) | 0x8;
  const p4 = `${variantNibble.toString(16)}${hex.slice(17, 20)}`;
  const p5 = hex.slice(20, 32);

  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

export function mapTransactionFromDb(row) {
  return {
    id: row.id,
    date: typeof row.date === "string" ? row.date.slice(0, 10) : String(row.date),
    type: row.type,
    category: row.category,
    description: (row.description ?? "").trim(),
    amount: Number(row.amount),
    paymentMethod: row.payment_method || "Tunai",
  };
}

export function mapTransactionToDb(t, userId) {
  return {
    id: toDeterministicUuid(t.id),
    user_id: userId,
    type: t.type,
    category: t.category,
    amount: t.amount,
    date: t.date,
    description: (t.description ?? "").trim(),
    payment_method: t.paymentMethod || "Tunai",
  };
}

export function mapBudgetFromDb(row) {
  return {
    id: row.id,
    month: row.month,
    category: row.category,
    limit: Number(row.limit_amount),
  };
}

export function mapBudgetToDb(b, userId) {
  const row = {
    user_id: userId,
    month: b.month,
    category: b.category,
    limit_amount: b.limit,
  };
  if (b.id && isValidUuid(b.id)) {
    row.id = b.id;
  }
  return row;
}
