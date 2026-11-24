import { useState } from "react";
import { Check, CheckCircle2, Eye, EyeOff, FileSpreadsheet, Loader2, Unlink } from "lucide-react";
import Modal from "./Modal.jsx";
import Field from "./Field.jsx";
import { describedBy } from "../utils/formHelpers.js";
import {
  clearSheetsConfig,
  getSheetsConfig,
  isValidGoogleScriptUrl,
  saveSheetsConfig,
  testSheetsConnection,
} from "../services/googleSheetsService.js";

export default function GoogleSheetsModal({ onClose, onConfigSaved, onNotify }) {
  const currentConfig = getSheetsConfig();
  const [url, setUrl] = useState(currentConfig.webAppUrl || "");
  const [token, setToken] = useState(currentConfig.secretToken || "");
  const [showToken, setShowToken] = useState(false);
  const [urlError, setUrlError] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const isConfigured = Boolean(currentConfig.webAppUrl);

  async function handleTest() {
    setTestResult(null);
    setUrlError(null);
    setTesting(true);
    const res = await testSheetsConnection(url, token);
    setTesting(false);
    if (res.ok) {
      setTestResult({
        ok: true,
        message: `Terhubung ke "${res.spreadsheetTitle || "Google Spreadsheet"}"`,
      });
    } else {
      setTestResult({ ok: false, message: res.error });
    }
  }

  function handleSave(e) {
    e.preventDefault();
    if (!isValidGoogleScriptUrl(url)) {
      setUrlError("Format tautan tidak valid. Pastikan diawali https://script.google.com/macros/s/ dan berakhiran /exec.");
      return;
    }

    saveSheetsConfig({
      webAppUrl: url.trim(),
      secretToken: token.trim(),
    });

    onNotify("success", "Pengaturan Google Sheets berhasil disimpan.");
    onConfigSaved();
    onClose();
  }

  function handleDisconnect() {
    clearSheetsConfig();
    onNotify("success", "Sambungan Google Sheets telah diputuskan.");
    onConfigSaved();
    onClose();
  }

  return (
    <Modal title="Hubungkan Google Sheets" onClose={onClose}>
      <form onSubmit={handleSave} noValidate className="flex flex-col gap-4 text-sm">
        <p className="text-xs leading-relaxed text-ink-soft text-pretty">
          Kirim rekap transaksi secara satu arah ke Google Sheets milik Anda sendiri tanpa duplikasi baris.
        </p>

        <details className="rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-xs text-ink-soft">
          <summary className="font-medium text-ink">Cara menyiapkan Google Sheets (3 langkah singkat)</summary>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 leading-relaxed">
            <li>Buat spreadsheet baru di Google Sheets, lalu buka menu Ekstensi &gt; Apps Script.</li>
            <li>
              Salin isi berkas <code className="font-mono text-ink">google-sheets/Code.gs</code>, ubah token rahasia di
              bagian atas, lalu klik Deploy &gt; New deployment &gt; Web app (akses: Anyone).
            </li>
            <li>Salin tautan Web app dan token rahasia Anda ke formulir di bawah, lalu klik Uji Koneksi.</li>
          </ol>
        </details>

        {testResult ? (
          <div
            role="alert"
            className={`rounded-lg border p-3 text-xs leading-relaxed ${
              testResult.ok
                ? "border-income/30 bg-income-soft text-income"
                : "border-expense/30 bg-expense-soft text-expense"
            }`}
          >
            {testResult.ok ? (
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={15} aria-hidden="true" /> {testResult.message}
              </span>
            ) : (
              testResult.message
            )}
          </div>
        ) : null}

        <Field
          id="sheets-url"
          label="Tautan Web App"
          error={urlError}
          hint="Contoh: https://script.google.com/macros/s/.../exec"
        >
          <input
            id="sheets-url"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setUrlError(null);
              setTestResult(null);
            }}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="input text-xs"
            aria-invalid={Boolean(urlError)}
            aria-describedby={describedBy("sheets-url", urlError, true)}
            required
          />
        </Field>

        <Field
          id="sheets-token"
          label="Token Rahasia"
          hint="Harus sama dengan token rahasia yang Anda atur di Apps Script."
        >
          <div className="relative">
            <input
              id="sheets-token"
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setTestResult(null);
              }}
              placeholder="Masukkan token rahasia Anda"
              className="input pr-12 text-xs"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowToken((prev) => !prev)}
              className="btn-icon absolute top-0 right-0"
              aria-label={showToken ? "Sembunyikan token" : "Tampilkan token"}
            >
              {showToken ? (
                <EyeOff size={16} strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Eye size={16} strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
          </div>
        </Field>

        {confirmDisconnect ? (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-expense/25 bg-expense-soft p-3 text-xs text-expense"
          >
            <span className="font-medium">Putuskan sambungan Google Sheets dari browser ini?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDisconnect(false)}
                className="inline-flex min-h-9 items-center rounded-lg border border-line bg-surface px-2.5 font-medium text-ink hover:bg-surface-2"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                className="inline-flex min-h-9 items-center rounded-lg bg-expense px-2.5 font-medium text-expense-ink hover:bg-expense/90"
              >
                Ya, putuskan
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <button
            type="button"
            disabled={testing || !url.trim()}
            onClick={handleTest}
            className="btn btn-secondary text-xs"
          >
            {testing ? (
              <>
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                Menguji...
              </>
            ) : (
              <>
                <Check size={14} strokeWidth={2} aria-hidden="true" />
                Uji Koneksi
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            {isConfigured && !confirmDisconnect ? (
              <button
                type="button"
                onClick={() => setConfirmDisconnect(true)}
                className="btn btn-danger text-xs"
                title="Putuskan sambungan"
              >
                <Unlink size={14} strokeWidth={1.75} aria-hidden="true" />
                Putuskan
              </button>
            ) : null}

            <button type="submit" className="btn btn-primary text-xs">
              <FileSpreadsheet size={14} strokeWidth={1.75} aria-hidden="true" />
              Simpan Pengaturan
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
