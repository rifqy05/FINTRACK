import { useRef, useState } from "react";
import {
  CloudUpload,
  FileJson,
  FileSpreadsheet,
  FlaskConical,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  RefreshCw,
  SlidersHorizontal,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import GoogleSheetsModal from "../components/GoogleSheetsModal.jsx";
import SyncStatus from "../components/SyncStatus.jsx";
import { todayISO } from "../utils/dates.js";
import { createBackupJson, downloadTextFile, transactionsToCsv } from "../utils/fileExport.js";
import { parseBackup } from "../utils/validation.js";
import { getSheetsConfig, syncTransactionsToGoogleSheets } from "../services/googleSheetsService.js";

// Baris pengaturan bergaya buku besar berpemisah garis tipis: label di kiri, kontrol di kanan.
function SettingRow({ title, description, children }) {
  return (
    <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-12 lg:items-center lg:gap-8">
      <div className="min-w-0 lg:col-span-5">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft text-pretty">{description}</p>
      </div>
      <div className="flex flex-col items-start gap-3 lg:col-span-7 lg:items-end">{children}</div>
    </div>
  );
}

export default function Settings({
  theme,
  onThemeChange,
  transactions,
  budgets,
  onImport,
  onClearAll,
  onLoadDemo,
  onNotify,
  user = null,
  onOpenAuth,
  onSignOut,
  syncStatus = "local",
  syncError = null,
  lastSavedAt = null,
  onRetrySync,
  onStartMigration,
  isDemoActive = false,
  hasLocalData = false,
  localCounts = { transactions: 0, budgets: 0 },
}) {
  const fileRef = useRef(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [sheetsConfig, setSheetsConfig] = useState(getSheetsConfig);
  const [sheetsModalOpen, setSheetsModalOpen] = useState(false);
  const [syncingSheets, setSyncingSheets] = useState(false);
  const hasData = transactions.length > 0 || budgets.length > 0;

  async function handleSyncSheets() {
    if (transactions.length === 0) {
      onNotify("error", "Belum ada transaksi untuk disinkronkan.");
      return;
    }
    setSyncingSheets(true);
    const res = await syncTransactionsToGoogleSheets(transactions, sheetsConfig);
    setSyncingSheets(false);
    setSheetsConfig(getSheetsConfig());
    if (res.ok) {
      onNotify(
        "success",
        `Sinkronisasi Google Sheets berhasil: ${res.stats.inserted} baru, ${res.stats.updated} diperbarui.`,
      );
    } else {
      onNotify("error", res.error || "Gagal menyinkronkan ke Google Sheets.");
    }
  }

  function exportCsv() {
    downloadTextFile(`fintrack-transaksi-${todayISO()}.csv`, transactionsToCsv(transactions), "text/csv");
    onNotify("success", `${transactions.length} transaksi diekspor ke CSV.`);
  }

  function exportBackup() {
    downloadTextFile(`fintrack-backup-${todayISO()}.json`, createBackupJson(transactions, budgets), "application/json");
    onNotify("success", "Backup JSON diunduh. Simpan di tempat yang aman.");
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onNotify("error", "File terlalu besar (maksimal 5 MB). Data lama tidak diubah.");
      return;
    }
    const result = parseBackup(await file.text());
    if (!result.ok) {
      onNotify("error", `Import gagal. ${result.error} Data lama tidak diubah.`);
      return;
    }
    setPendingImport(result.data);
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Preferensi dan integrasi" className="card divide-y divide-line overflow-hidden">
        <SettingRow
          title="Tampilan"
          description="Pilih tema terang (batu hangat + rail obsidian), gelap (obsidian matte), atau ikuti pengaturan sistem perangkat."
        >
          <div
            role="radiogroup"
            aria-label="Tema"
            className="grid w-full max-w-sm grid-cols-3 gap-1 rounded-xl border border-line bg-surface-2 p-1"
          >
            {[
              { value: "light", label: "Terang", icon: Sun },
              { value: "dark", label: "Gelap", icon: Moon },
              { value: "system", label: "Sistem", icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <label
                key={value}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-ink-soft transition-colors hover:text-ink has-checked:bg-brand has-checked:text-brand-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[var(--focus)] sm:text-sm"
              >
                <input
                  type="radio"
                  name="theme"
                  value={value}
                  checked={theme === value}
                  onChange={() => onThemeChange(value)}
                  className="sr-only"
                />
                <Icon size={15} strokeWidth={1.85} aria-hidden="true" />
                {label}
              </label>
            ))}
          </div>
        </SettingRow>

        <SettingRow
          title="Akun & Sinkronisasi Cloud"
          description={
            user
              ? `Terhubung sebagai ${user.email}. Transaksi dan anggaran tersimpan otomatis ke akun cloud Anda.`
              : "Data saat ini tersimpan di browser ini saja. Masuk atau daftar akun untuk menyinkronkan catatan antar-perangkat."
          }
        >
          <div className="flex w-full flex-col items-start gap-3 lg:items-end">
            <SyncStatus
              status={syncStatus}
              error={syncError}
              lastSavedAt={lastSavedAt}
              showDetail
              onRetry={onRetrySync}
              className="lg:items-end lg:text-right"
            />
            <div className="flex flex-wrap items-center gap-2">
              {user ? (
                <>
                  <button type="button" onClick={onSignOut} className="btn btn-secondary">
                    <LogOut size={17} strokeWidth={1.75} aria-hidden="true" />
                    Keluar dari Akun
                  </button>
                  {hasLocalData ? (
                    <button
                      type="button"
                      onClick={onStartMigration}
                      className="btn btn-primary h-auto py-2.5 text-left whitespace-normal"
                    >
                      <CloudUpload size={17} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
                      Migrasikan Data Lokal ({localCounts.transactions} transaksi, {localCounts.budgets} anggaran)
                    </button>
                  ) : null}
                </>
              ) : (
                <button type="button" onClick={onOpenAuth} className="btn btn-primary">
                  <LogIn size={17} strokeWidth={1.75} aria-hidden="true" />
                  Masuk / Buat Akun Cloud
                </button>
              )}
            </div>
          </div>
        </SettingRow>

        <SettingRow
          title="Backup & Pulihkan Data"
          description={
            user
              ? "Unduh cadangan JSON kapan saja sebagai arsip pribadi. Import JSON akan menggabungkan dan memperbarui catatan di akun cloud Anda."
              : "Catatan lokal hanya tersimpan di browser ini. Unduh backup secara berkala; import JSON akan mengganti seluruh data lokal."
          }
        >
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <button
              type="button"
              onClick={exportBackup}
              disabled={!hasData}
              className={`btn ${user ? "btn-primary" : "btn-secondary"}`}
            >
              <FileJson size={17} strokeWidth={1.75} aria-hidden="true" />
              Unduh backup JSON
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-secondary">
              <Upload size={17} strokeWidth={1.75} aria-hidden="true" />
              Import JSON
            </button>
            <button type="button" onClick={exportCsv} disabled={transactions.length === 0} className="btn btn-secondary">
              <FileSpreadsheet size={17} strokeWidth={1.75} aria-hidden="true" />
              Unduh CSV
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFile}
              className="sr-only"
              tabIndex={-1}
              aria-label="Pilih file backup JSON"
            />
          </div>
        </SettingRow>

        <SettingRow
          title="Integrasi Google Sheets"
          description="Kirim rekap transaksi secara satu arah ke spreadsheet Google milik Anda tanpa duplikasi baris."
        >
          {sheetsConfig.webAppUrl ? (
            <div className="flex w-full flex-col items-start gap-2.5 lg:items-end">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="badge border-line-strong bg-surface-2 text-ink">Terhubung ke Google Sheets</span>
                <span className="text-ink-soft">
                  {sheetsConfig.lastSyncAt ? `Terakhir sinkron: ${sheetsConfig.lastSyncAt}` : "Belum pernah disinkronkan"}
                </span>
              </div>

              {sheetsConfig.lastSyncStats ? (
                <p className="text-xs text-ink-soft">
                  Hasil terakhir: {sheetsConfig.lastSyncStats.inserted} baru, {sheetsConfig.lastSyncStats.updated}{" "}
                  diperbarui.
                </p>
              ) : null}

              {sheetsConfig.lastSyncError ? (
                <p className="text-xs text-expense">Error terakhir: {sheetsConfig.lastSyncError}</p>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleSyncSheets}
                  disabled={syncingSheets || transactions.length === 0}
                  className="btn btn-secondary"
                >
                  <RefreshCw
                    size={17}
                    strokeWidth={1.75}
                    className={syncingSheets ? "animate-spin" : ""}
                    aria-hidden="true"
                  />
                  {syncingSheets ? "Menyinkronkan..." : "Sinkronkan Sekarang"}
                </button>
                <button type="button" onClick={() => setSheetsModalOpen(true)} className="btn btn-secondary">
                  <SlidersHorizontal size={17} strokeWidth={1.75} aria-hidden="true" />
                  Ubah Pengaturan
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-2.5 lg:items-end">
              <p className="text-xs text-ink-soft">Belum terhubung ke spreadsheet.</p>
              <button type="button" onClick={() => setSheetsModalOpen(true)} className="btn btn-secondary">
                <FileSpreadsheet size={17} strokeWidth={1.75} aria-hidden="true" />
                Hubungkan Google Sheets
              </button>
            </div>
          )}
        </SettingRow>

        <SettingRow
          title="Data contoh"
          description={
            user
              ? "Tambahkan transaksi dan anggaran contoh ke akun cloud Anda untuk mencoba semua grafik dan laporan."
              : "Isi aplikasi dengan transaksi dan anggaran contoh untuk mencoba semua fitur. Dapat dihapus kembali kapan saja."
          }
        >
          <div className="flex flex-col items-start gap-2.5 lg:items-end">
            {isDemoActive ? (
              <span className="badge border-warn/30 bg-warn-soft text-warn">
                <FlaskConical size={12} strokeWidth={2} aria-hidden="true" />
                Data contoh sedang aktif
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => (hasData ? setConfirm("demo") : onLoadDemo())}
              className="btn btn-secondary"
            >
              <FlaskConical size={17} strokeWidth={1.75} aria-hidden="true" />
              Muat data contoh
            </button>
          </div>
        </SettingRow>
      </section>

      {/* Zona bahaya dipisahkan secara visual dengan garis tegas di bagian bawah */}
      <section className="rounded-2xl border border-expense/30 bg-expense-soft/40 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-ink">Hapus seluruh data</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-soft text-pretty">
              {user
                ? "Menghapus permanen semua transaksi dan anggaran di akun cloud Anda. Unduh backup JSON terlebih dahulu bila masih dibutuhkan."
                : "Menghapus permanen semua transaksi dan anggaran dari browser ini. Unduh backup JSON terlebih dahulu bila masih dibutuhkan."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirm("clear")}
            disabled={!hasData}
            className="btn btn-danger shrink-0"
          >
            <Trash2 size={17} strokeWidth={1.75} aria-hidden="true" />
            Hapus seluruh data
          </button>
        </div>
      </section>

      {pendingImport ? (
        <ConfirmDialog
          danger={!user}
          title={user ? "Impor data ke akun cloud?" : "Ganti data dengan isi file ini?"}
          message={
            user
              ? `File berisi ${pendingImport.transactions.length} transaksi dan ${pendingImport.budgets.length} anggaran. Data akan digabungkan ke akun cloud Anda (ID yang sama akan diperbarui).`
              : `File berisi ${pendingImport.transactions.length} transaksi dan ${pendingImport.budgets.length} anggaran. Seluruh data lokal saat ini (${transactions.length} transaksi, ${budgets.length} anggaran) akan diganti.`
          }
          confirmLabel={user ? "Impor ke cloud" : "Ganti data"}
          onCancel={() => setPendingImport(null)}
          onConfirm={() => {
            onImport(pendingImport);
            setPendingImport(null);
          }}
        />
      ) : null}

      {confirm === "clear" ? (
        <ConfirmDialog
          danger
          title="Hapus seluruh data?"
          message={
            user
              ? `${transactions.length} transaksi dan ${budgets.length} anggaran akan dihapus permanen dari akun cloud Anda.`
              : `${transactions.length} transaksi dan ${budgets.length} anggaran akan dihapus permanen dari browser ini.`
          }
          confirmLabel="Hapus semua"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            onClearAll();
            setConfirm(null);
          }}
        />
      ) : null}

      {confirm === "demo" ? (
        <ConfirmDialog
          title={user ? "Tambahkan data contoh ke cloud?" : "Ganti data dengan data contoh?"}
          message={
            user
              ? "Transaksi dan anggaran contoh akan ditambahkan ke akun cloud Anda tanpa menghapus catatan yang sudah ada."
              : "Data lokal Anda saat ini akan diganti dengan data contoh. Unduh backup terlebih dahulu jika masih diperlukan."
          }
          confirmLabel={user ? "Tambahkan data contoh" : "Ganti dengan data contoh"}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            onLoadDemo();
            setConfirm(null);
          }}
        />
      ) : null}

      {sheetsModalOpen ? (
        <GoogleSheetsModal
          onClose={() => setSheetsModalOpen(false)}
          onConfigSaved={() => setSheetsConfig(getSheetsConfig())}
          onNotify={onNotify}
        />
      ) : null}
    </div>
  );
}
