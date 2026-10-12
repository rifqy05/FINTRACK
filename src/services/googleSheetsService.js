const SHEETS_STORAGE_KEY = "fintrack_google_sheets_v1";

let memoryStorage = {};

function getStorage() {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  if (typeof globalThis !== "undefined" && globalThis.localStorage) return globalThis.localStorage;
  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(memoryStorage, key) ? memoryStorage[key] : null),
    setItem: (key, val) => {
      memoryStorage[key] = String(val);
    },
    removeItem: (key) => {
      delete memoryStorage[key];
    },
  };
}

export function getSheetsConfig() {
  try {
    const raw = getStorage().getItem(SHEETS_STORAGE_KEY);
    return raw
      ? JSON.parse(raw)
      : {
          webAppUrl: "",
          secretToken: "",
          lastSyncAt: null,
          lastSyncStatus: null, // "success" | "error" | null
          lastSyncStats: null,
          lastSyncError: null,
        };
  } catch {
    return {
      webAppUrl: "",
      secretToken: "",
      lastSyncAt: null,
      lastSyncStatus: null,
      lastSyncStats: null,
      lastSyncError: null,
    };
  }
}

export function saveSheetsConfig(config) {
  try {
    const current = getSheetsConfig();
    const next = { ...current, ...config };
    getStorage().setItem(SHEETS_STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return null;
  }
}

export function clearSheetsConfig() {
  try {
    getStorage().removeItem(SHEETS_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function isValidGoogleScriptUrl(url) {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith("https://script.google.com/macros/s/") &&
    trimmed.endsWith("/exec")
  );
}

export async function testSheetsConnection(webAppUrl, secretToken = "") {
  const url = (webAppUrl || "").trim();
  if (!isValidGoogleScriptUrl(url)) {
    return {
      ok: false,
      error:
        "URL Google Apps Script tidak valid. Pastikan diawali dengan https://script.google.com/macros/s/ dan berakhiran /exec.",
    };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // text/plain mencegah CORS preflight OPTIONS yang sering gagal di Google Apps Script
      },
      body: JSON.stringify({
        action: "ping",
        secretToken: (secretToken || "").trim(),
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Server Google Sheets merespons dengan kode status ${response.status}.`,
      };
    }

    const data = await response.json();
    if (!data.ok) {
      return { ok: false, error: data.error || "Uji koneksi ditolak oleh script." };
    }

    return {
      ok: true,
      message: data.message || "Koneksi berhasil!",
      spreadsheetTitle: data.spreadsheetTitle,
    };
  } catch {
    return {
      ok: false,
      error:
        "Gagal terhubung ke Google Apps Script. Pastikan Web App di-deploy dengan akses 'Anyone' dan URL sudah benar.",
    };
  }
}

export async function syncTransactionsToGoogleSheets(transactions, configOverride = null) {
  const config = configOverride || getSheetsConfig();
  const url = (config.webAppUrl || "").trim();

  if (!isValidGoogleScriptUrl(url)) {
    return {
      ok: false,
      error: "Google Sheets belum dikonfigurasi atau URL tidak valid.",
    };
  }

  const payload = {
    action: "sync_transactions",
    secretToken: (config.secretToken || "").trim(),
    transactions: (transactions || []).map((t) => ({
      id: t.id,
      date: t.date,
      type: t.type,
      category: t.category,
      description: t.description || "",
      amount: t.amount,
      paymentMethod: t.paymentMethod || "Tunai",
    })),
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorMsg = `Server Google Sheets merespons dengan status ${response.status}.`;
      saveSheetsConfig({
        lastSyncStatus: "error",
        lastSyncError: errorMsg,
      });
      return { ok: false, error: errorMsg };
    }

    const data = await response.json();
    if (!data.ok) {
      saveSheetsConfig({
        lastSyncStatus: "error",
        lastSyncError: data.error || "Sinkronisasi ditolak oleh script.",
      });
      return { ok: false, error: data.error || "Gagal melakukan sinkronisasi." };
    }

    const nowISO = new Date().toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    saveSheetsConfig({
      lastSyncAt: nowISO,
      lastSyncStatus: "success",
      lastSyncStats: data.stats,
      lastSyncError: null,
    });

    return { ok: true, stats: data.stats, syncedAt: nowISO };
  } catch {
    const errorMsg =
      "Gagal mengirim data ke Google Sheets. Periksa koneksi internet dan izin Web App.";
    saveSheetsConfig({
      lastSyncStatus: "error",
      lastSyncError: errorMsg,
    });
    return { ok: false, error: errorMsg };
  }
}
