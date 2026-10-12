import { useState } from "react";
import { Check, CheckCircle2, FileSpreadsheet, Loader2, Unlink } from "lucide-react";
import Modal from "./Modal.jsx";
import Field from "./Field.jsx";
import {
  getSheetsConfig,
  saveSheetsConfig,
  clearSheetsConfig,
  testSheetsConnection,
  isValidGoogleScriptUrl,
} from "../services/googleSheetsService.js";

export default function GoogleSheetsModal({ onClose, onConfigSaved, onNotify }) {
  const currentConfig = getSheetsConfig();
  const [url, setUrl] = useState(currentConfig.webAppUrl || "");
  const [token, setToken] = useState(currentConfig.secretToken || "");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { ok: boolean, message: string }

  const isConfigured = Boolean(currentConfig.webAppUrl);

  async function handleTest() {
    setTestResult(null);
    setTesting(true);
    const res = await testSheetsConnection(url, token);
    setTesting(false);
    if (res.ok) {
      setTestResult({
        ok: true,
        message: `Terhubung ke: "${res.spreadsheetTitle || "Google Spreadsheet"}"`,
      });
    } else {
      setTestResult({ ok: false, message: res.error });
    }
  }

  function handleSave(e) {
    e.preventDefault();
    if (!isValidGoogleScriptUrl(url)) {
      setTestResult({
        ok: false,
        message: "Format URL tidak valid. Pastikan berakhiran /exec.",
      });
      return;
    }

    saveSheetsConfig({
      webAppUrl: url.trim(),
      secretToken: token.trim(),
    });

    onNotify("success", "Konfigurasi Google Sheets berhasil disimpan.");
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
    <Modal title="Konfigurasi Integrasi Google Sheets" onClose={onClose}>
      <form onSubmit={handleSave} className="flex flex-col gap-4 text-sm">
        <p className="text-xs text-ink-soft leading-relaxed">
          Hubungkan Google Sheets melalui Google Apps Script Web App untuk membuat rekap dan cadangan
          eksternal satu arah secara otomatis.
        </p>

        {testResult ? (
          <div
            role="alert"
            className={`rounded-lg border p-3 text-xs leading-relaxed ${
              testResult.ok
                ? "border-brand/30 bg-brand-soft text-brand"
                : "border-expense/30 bg-expense-soft text-expense"
            }`}
          >
            {testResult.ok ? (
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={15} /> {testResult.message}
              </span>
            ) : (
              testResult.message
            )}
          </div>
        ) : null}

        <Field
          id="sheets-url"
          label="Web App URL"
          hint="URL hasil deploy Web App (contoh: https://script.google.com/macros/s/.../exec)"
        >
          <input
            id="sheets-url"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setTestResult(null);
            }}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="input text-xs"
            required
          />
        </Field>

        <Field
          id="sheets-token"
          label="Secret Token"
          hint="Token rahasia yang Anda tentukan di CONFIG_SECRET_TOKEN pada Code.gs (opsional tapi disarankan)"
        >
          <input
            id="sheets-token"
            type="text"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              setTestResult(null);
            }}
            placeholder="fintrack-secret-token"
            className="input text-xs"
          />
        </Field>

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
            {isConfigured ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="btn btn-danger text-xs"
                title="Putuskan sambungan"
              >
                <Unlink size={14} strokeWidth={1.75} aria-hidden="true" />
                Putuskan
              </button>
            ) : null}

            <button type="submit" className="btn btn-primary text-xs">
              <FileSpreadsheet size={14} strokeWidth={1.75} aria-hidden="true" />
              Simpan Konfigurasi
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
