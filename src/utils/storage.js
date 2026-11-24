// Baca dan tulis localStorage dengan aman. Data divalidasi saat dibaca, jadi data
// yang rusak atau diedit manual tidak membuat aplikasi error.

import { PAYMENT_METHODS, STORAGE_KEYS } from "./constants.js";
import { getBudgetError, getTransactionError, normalizeBudget, normalizeTransaction } from "./validation.js";

function readJson(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // penyimpanan penuh atau diblokir browser
  }
}

export function loadTransactions() {
  const stored = readJson(STORAGE_KEYS.transactions);
  if (!Array.isArray(stored)) return [];
  const seen = new Set();
  return stored
    .filter((t) => {
      if (getTransactionError(t) || seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    })
    .map(normalizeTransaction);
}

export function loadBudgets() {
  const stored = readJson(STORAGE_KEYS.budgets);
  if (!Array.isArray(stored)) return [];
  const seen = new Set();
  return stored
    .filter((b) => {
      if (getBudgetError(b)) return false;
      const key = `${b.month}|${b.category}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(normalizeBudget);
}

// Tema: "light", "dark", atau "system" (mengikuti sistem operasi).
export function loadTheme() {
  const stored = readJson(STORAGE_KEYS.theme);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

export const saveTransactions = (list) => writeJson(STORAGE_KEYS.transactions, list);
export const saveBudgets = (list) => writeJson(STORAGE_KEYS.budgets, list);
export const saveTheme = (theme) => writeJson(STORAGE_KEYS.theme, theme);

export function loadPrivacyMode() {
  return readJson(STORAGE_KEYS.privacyMode) === true;
}

export const savePrivacyMode = (enabled) => writeJson(STORAGE_KEYS.privacyMode, Boolean(enabled));

export function loadLastPaymentMethod() {
  const stored = readJson(STORAGE_KEYS.lastPaymentMethod);
  return PAYMENT_METHODS.includes(stored) ? stored : "Tunai";
}

export function saveLastPaymentMethod(method) {
  if (!PAYMENT_METHODS.includes(method)) return false;
  return writeJson(STORAGE_KEYS.lastPaymentMethod, method);
}

export function loadRecurringTemplates() {
  const stored = readJson(STORAGE_KEYS.recurring);
  if (!Array.isArray(stored)) return [];
  const seen = new Set();
  return stored.filter((item) => {
    if (!item || typeof item !== "object" || typeof item.id !== "string" || seen.has(item.id)) return false;
    if (item.type !== "income" && item.type !== "expense") return false;
    if (!Number.isInteger(item.amount) || item.amount <= 0) return false;
    if (typeof item.category !== "string" || !item.category) return false;
    seen.add(item.id);
    return true;
  });
}

export const saveRecurringTemplates = (list) => writeJson(STORAGE_KEYS.recurring, list);

export function removeAllStoredData() {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.transactions);
    window.localStorage.removeItem(STORAGE_KEYS.budgets);
  } catch {
    // diabaikan, state React tetap dikosongkan
  }
}

// ID unik. crypto.randomUUID hanya ada di konteks aman (https atau localhost),
// jadi sediakan cadangan supaya aplikasi tetap jalan saat dibuka lewat alamat LAN.
export function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `tx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
