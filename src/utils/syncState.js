// Status sinkronisasi: label, nada warna, dan ringkasan waktu simpan terakhir.
// Logika murni tanpa React supaya bisa diuji langsung.

export const SYNC_STATES = {
  local: { label: "Mode lokal", tone: "neutral" },
  offline: { label: "Mode offline", tone: "warn" },
  saving: { label: "Menyimpan...", tone: "busy" },
  saved: { label: "Tersimpan", tone: "ok" },
  error: { label: "Gagal sinkron", tone: "bad" },
};

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function pad(value) {
  return String(value).padStart(2, "0");
}

// Waktu simpan terakhir dalam format jam lokal: "09.31" (hari ini) atau
// "12 Okt 09.31" / "12 Okt 2025 09.31" untuk hari lain. String kosong bila
// belum ada waktu yang valid.
export function formatSyncTime(iso, now = new Date()) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const time = `${pad(date.getHours())}.${pad(date.getMinutes())}`;
  const sameDay =
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  if (sameDay) return time;

  const day = `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
  return date.getFullYear() === now.getFullYear() ? `${day} ${time}` : `${day} ${date.getFullYear()} ${time}`;
}

// Ringkasan untuk ditampilkan: label, nada, keterangan, dan apakah bisa dicoba ulang.
export function describeSync(state, { lastSavedAt = null, error = null } = {}) {
  const base = SYNC_STATES[state] ?? SYNC_STATES.local;
  const time = formatSyncTime(lastSavedAt);

  let detail = "";
  if (state === "saved") {
    detail = time ? `Terakhir disimpan ke cloud pukul ${time}.` : "";
  } else if (state === "error") {
    detail = error || "Perubahan terakhir belum tersimpan ke cloud.";
  } else if (state === "offline") {
    detail =
      "Perangkat sedang offline. Catatan yang tampil tetap aman, tetapi perubahan baru belum bisa disimpan ke cloud sampai koneksi kembali.";
  } else if (state === "local") {
    detail = error || "Data tersimpan di perangkat ini. Masuk ke akun cloud untuk menyinkronkan antar-perangkat.";
  }

  return {
    label: base.label,
    tone: base.tone,
    detail,
    time,
    retryable: state === "error" || state === "offline",
  };
}
