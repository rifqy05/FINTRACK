import { useState } from "react";
import { CloudUpload, Download, Loader2 } from "lucide-react";
import Modal from "./Modal.jsx";
import { createBackupJson, downloadTextFile } from "../utils/fileExport.js";
import { todayISO } from "../utils/dates.js";

export default function MigrationModal({
  transactionCount,
  budgetCount,
  transactions,
  budgets,
  onConfirm,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleDownloadBackup() {
    downloadTextFile(
      `fintrack-backup-sebelum-migrasi-${todayISO()}.json`,
      createBackupJson(transactions, budgets),
      "application/json"
    );
  }

  async function handleStartMigration() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message || "Gagal melakukan migrasi data.");
      setLoading(false);
    }
  }

  return (
    <Modal title="Migrasikan Data Lokal ke Cloud" onClose={onClose}>
      <div className="flex flex-col gap-4 text-sm leading-relaxed text-ink-soft">
        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-expense/20 bg-expense-soft p-3 text-sm text-expense"
          >
            {error}
          </div>
        ) : null}

        <p>
          Ditemukan <strong className="text-ink">{transactionCount} transaksi</strong> dan{" "}
          <strong className="text-ink">{budgetCount} anggaran</strong> di penyimpanan browser lokal Anda.
        </p>

        <p>
          Anda dapat menyalin data tersebut ke akun cloud FinTrack agar tersimpan aman dan dapat diakses dari perangkat
          lain.
        </p>

        <div className="rounded-lg border border-line bg-surface-2 p-3 text-xs">
          <strong className="text-ink">Penting:</strong> Data di browser ini tidak akan dihapus dan akan
          tetap aman. Anda disarankan mengunduh backup sebelum melanjutkan.
        </div>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={handleDownloadBackup}
            className="btn btn-secondary justify-center text-xs"
          >
            <Download size={16} strokeWidth={1.75} aria-hidden="true" />
            Unduh Backup JSON
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="btn btn-secondary justify-center text-xs"
          >
            Nanti Saja
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleStartMigration}
            className="btn btn-primary justify-center text-xs"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Memigrasikan...
              </>
            ) : (
              <>
                <CloudUpload size={16} strokeWidth={1.75} aria-hidden="true" />
                Migrasikan Sekarang
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
