import { loadTransactions, loadBudgets } from "../utils/storage.js";
import { getTransactionError, getBudgetError } from "../utils/validation.js";
import { batchUpsertTransactions } from "./transactionService.js";
import { batchUpsertBudgets } from "./budgetService.js";

export function getLocalDataToMigrate() {
  const transactions = loadTransactions();
  const budgets = loadBudgets();
  return {
    hasData: transactions.length > 0 || budgets.length > 0,
    transactionCount: transactions.length,
    budgetCount: budgets.length,
    transactions,
    budgets,
  };
}

export async function migrateLocalDataToSupabase(userId) {
  if (!userId) {
    return { ok: false, error: "Pengguna harus login terlebih dahulu sebelum migrasi data." };
  }

  const { transactions, budgets } = getLocalDataToMigrate();

  if (transactions.length === 0 && budgets.length === 0) {
    return { ok: false, error: "Tidak ada data lokal yang perlu dimigrasikan." };
  }

  // Validasi data lokal terlebih dahulu
  const validTransactions = transactions.filter((t) => !getTransactionError(t));
  const validBudgets = budgets.filter((b) => !getBudgetError(b));

  try {
    if (validTransactions.length > 0) {
      const txResult = await batchUpsertTransactions(validTransactions, userId);
      if (!txResult.ok) {
        return { ok: false, error: txResult.error || "Gagal mengunggah transaksi ke cloud." };
      }
    }

    if (validBudgets.length > 0) {
      const bgResult = await batchUpsertBudgets(validBudgets, userId);
      if (!bgResult.ok) {
        return { ok: false, error: bgResult.error || "Gagal mengunggah anggaran ke cloud." };
      }
    }

    return {
      ok: true,
      migratedTransactions: validTransactions.length,
      migratedBudgets: validBudgets.length,
      skippedTransactions: transactions.length - validTransactions.length,
      skippedBudgets: budgets.length - validBudgets.length,
    };
  } catch (err) {
    return { ok: false, error: err.message || "Terjadi kesalahan saat proses migrasi data." };
  }
}
