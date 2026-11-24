// Logika murni untuk template transaksi rutin bulanan (tanpa duplikasi per bulan).

import { MAX_AMOUNT, MAX_DESCRIPTION_LENGTH, PAYMENT_METHODS, categoriesFor } from "./constants.js";
import { daysInMonth, monthKeyOf } from "./dates.js";

export function validateRecurringInput(input) {
  const errors = {};
  const type = input.type === "income" || input.type === "expense" ? input.type : "";
  if (!type) errors.type = "Pilih jenis transaksi.";

  const allowed = categoriesFor(type);
  const category = typeof input.category === "string" ? input.category.trim() : "";
  if (!category || (allowed.length > 0 && !allowed.includes(category))) {
    errors.category = "Pilih kategori yang sesuai.";
  }

  const digits = String(input.amount ?? "").replace(/\D/g, "");
  const amount = digits ? Number(digits) : NaN;
  if (!Number.isInteger(amount) || amount <= 0) {
    errors.amount = "Masukkan nominal lebih dari Rp 0.";
  } else if (amount > MAX_AMOUNT) {
    errors.amount = "Nominal terlalu besar.";
  }

  const description = typeof input.description === "string" ? input.description.trim() : "";
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Keterangan maksimal ${MAX_DESCRIPTION_LENGTH} karakter.`;
  }

  const paymentMethod = PAYMENT_METHODS.includes(input.paymentMethod) ? input.paymentMethod : "Transfer";
  const parsedDay = Number(input.dayOfMonth);
  const dayOfMonth = Number.isInteger(parsedDay) ? Math.min(28, Math.max(1, parsedDay)) : 1;

  if (Object.keys(errors).length > 0) return { valid: false, errors };

  return {
    valid: true,
    clean: {
      type,
      category,
      amount,
      description,
      paymentMethod,
      dayOfMonth,
    },
  };
}

function signatureOf(item) {
  return `${item.type}|${item.category}|${item.amount}|${(item.description || "").trim().toLowerCase()}`;
}

export function isRecurringRecordedInMonth(template, monthKey, transactions) {
  const targetSig = signatureOf(template);
  return transactions.some((t) => monthKeyOf(t.date) === monthKey && signatureOf(t) === targetSig);
}

export function buildMonthlyRecurringTransactions(templates, monthKey, existingTransactions, makeId) {
  const maxDay = daysInMonth(monthKey);
  const created = [];

  for (const tpl of templates) {
    if (isRecurringRecordedInMonth(tpl, monthKey, existingTransactions)) continue;
    const day = Math.min(maxDay, Math.max(1, Number(tpl.dayOfMonth) || 1));
    const date = `${monthKey}-${String(day).padStart(2, "0")}`;
    created.push({
      id: makeId(),
      date,
      type: tpl.type,
      category: tpl.category,
      amount: tpl.amount,
      description: tpl.description || tpl.category,
      paymentMethod: PAYMENT_METHODS.includes(tpl.paymentMethod) ? tpl.paymentMethod : "Transfer",
    });
  }

  return created;
}

export function countPendingRecurringForMonth(templates, monthKey, existingTransactions) {
  return templates.filter((tpl) => !isRecurringRecordedInMonth(tpl, monthKey, existingTransactions)).length;
}
