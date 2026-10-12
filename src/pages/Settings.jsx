import { useRef, useState } from "react";
import {
  Database,
  FileJson,
  FileSpreadsheet,
  FlaskConical,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { todayISO } from "../utils/dates.js";
import { createBackupJson, downloadTextFile, transactionsToCsv } from "../utils/fileExport.js";
import { parseBackup } from "../utils/validation.js";

function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="card p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{children}</div>
    </section>
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
}) {
  const fileRef = useRef(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [confirm, setConfirm] = useState(null); // "clear" | "demo" | null
  const hasData = transactions.length > 0 || budgets.length > 0;

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
    event.target.value = ""; // supaya file yang sama bisa dipilih lagi
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
    <div className="flex flex-col gap-4 sm:gap-5">
      <Section
        icon={theme === "dark" ? Moon : Sun}
        title="Tampilan"
        description="Pilih tema terang atau gelap. Pilihan ini diingat di browser."
      >
        <div role="radiogroup" aria-label="Tema" className="grid w-full max-w-sm grid-cols-2 gap-2">
          {[
            { value: "light", label: "Terang", icon: Sun },
            { value: "dark", label: "Gelap", icon: Moon },
          ].map(({ value, label, icon: Icon }) => (
            <label
              key={value}
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line text-sm font-medium text-ink-soft has-checked:border-brand has-checked:bg-brand-soft has-checked:text-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[var(--focus)]"
            >
              <input
                type="radio"
                name="theme"
                value={value}
                checked={theme === value}
                onChange={() => onThemeChange(value)}
                className="sr-only"
              />
              <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
              {label}
            </label>
          ))}
        </div>
      </Section>

      <Section
        icon={FileSpreadsheet}
        title="Ekspor transaksi (CSV)"
        description="Semua transaksi dalam satu file yang bisa dibuka di Excel. Pemisah kolom adalah titik koma (;), sesuai Excel berbahasa Indonesia. Untuk hasil sesuai filter, gunakan tombol Ekspor di halaman Transaksi atau Laporan."
      >
        <button type="button" onClick={exportCsv} disabled={transactions.length === 0} className="btn btn-secondary">
          <FileSpreadsheet size={18} strokeWidth={1.75} aria-hidden="true" />
          Unduh CSV
        </button>
      </Section>

      <Section
        icon={Database}
        title="Backup dan pulihkan data"
        description="Data hanya tersimpan di browser dan perangkat ini. Menghapus data browser akan menghapus catatan Anda, jadi unduh backup secara berkala. Import mengganti seluruh data yang ada."
      >
        <button type="button" onClick={exportBackup} disabled={!hasData} className="btn btn-primary">
          <FileJson size={18} strokeWidth={1.75} aria-hidden="true" />
          Unduh backup JSON
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-secondary">
          <Upload size={18} strokeWidth={1.75} aria-hidden="true" />
          Import dari JSON
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
      </Section>

      <Section
        icon={FlaskConical}
        title="Data contoh"
        description="Isi aplikasi dengan transaksi dan anggaran contoh untuk mencoba semua fitur. Bisa dihapus kapan saja lewat tombol hapus seluruh data."
      >
        <button
          type="button"
          onClick={() => (hasData ? setConfirm("demo") : onLoadDemo())}
          className="btn btn-secondary"
        >
          <FlaskConical size={18} strokeWidth={1.75} aria-hidden="true" />
          Muat data contoh
        </button>
      </Section>

      <Section
        icon={ShieldCheck}
        title="Hapus seluruh data"
        description="Menghapus semua transaksi dan anggaran dari browser ini. Tindakan ini tidak bisa dibatalkan, jadi buat backup lebih dulu jika masih perlu."
      >
        <button type="button" onClick={() => setConfirm("clear")} disabled={!hasData} className="btn btn-danger">
          <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" />
          Hapus seluruh data
        </button>
      </Section>

      {pendingImport ? (
        <ConfirmDialog
          danger
          title="Ganti data dengan isi file ini?"
          message={`File berisi ${pendingImport.transactions.length} transaksi dan ${pendingImport.budgets.length} anggaran. Seluruh data saat ini (${transactions.length} transaksi, ${budgets.length} anggaran) akan diganti.`}
          confirmLabel="Ganti data"
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
          message={`${transactions.length} transaksi dan ${budgets.length} anggaran akan dihapus permanen dari browser ini.`}
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
          title="Ganti data dengan data contoh?"
          message="Data Anda saat ini akan diganti dengan data contoh. Unduh backup lebih dulu jika data Anda masih diperlukan."
          confirmLabel="Ganti dengan data contoh"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            onLoadDemo();
            setConfirm(null);
          }}
        />
      ) : null}
    </div>
  );
}
