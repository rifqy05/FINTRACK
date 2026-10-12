# FinTrack: Personal Finance Tracker

Website pencatatan keuangan pribadi. Catat pemasukan dan pengeluaran, pantau saldo, atur anggaran per kategori, dan lihat laporan bulanan. Aplikasi bisa dipakai langsung tanpa akun (data tersimpan di browser lewat `localStorage`), atau masuk ke akun cloud (Supabase) agar data tersinkron antar-perangkat. Tersedia juga ekspor/sinkronisasi satu arah ke Google Sheets dan asisten AI yang menjawab pertanyaan berdasarkan perhitungan aplikasi sendiri. Tanpa konfigurasi tambahan, FinTrack tetap berjalan penuh dalam mode lokal.

## Instalasi dan menjalankan

Butuh Node.js 20 atau lebih baru.

```bash
npm install
npm run dev       # development, buka alamat yang tampil (biasanya http://localhost:5173)
npm run build     # build produksi ke folder dist/
npm run preview   # coba hasil build
npm test          # unit test (Vitest)
npm run lint      # Oxlint
npm run server    # backend AI Financial Assistant (opsional, lihat bagian Asisten AI)
```

## Teknologi

React 19, Vite, JavaScript (tanpa TypeScript), Tailwind CSS v4 (`@tailwindcss/vite`), Recharts, Lucide React, font Geist (self-hosted lewat `@fontsource`), `Intl.NumberFormat` untuk Rupiah, `crypto.randomUUID()` untuk ID (dengan cadangan jika konteks tidak aman).

> Catatan: PRD menyebut "CSS biasa". Proyek ini memakai Tailwind v4 sesuai permintaan. Token warna dan tema ada di `src/index.css`, jadi mengganti ke CSS biasa tetap mudah.

## Struktur folder

```text
fintrack/
├── public/favicon.svg
├── src/
│   ├── components/      komponen UI yang dipakai ulang
│   │   ├── Sidebar, Header, SummaryCard, EmptyState
│   │   ├── TransactionForm, TransactionTable, CategoryBreakdown
│   │   ├── Charts (bar dan garis), BudgetProgress, MonthPicker
│   │   ├── AuthModal, MigrationModal, GoogleSheetsModal
│   │   └── Modal, ConfirmDialog, Field, Toast, navItems
│   ├── pages/           Dashboard, Transactions, Budgets, Reports, Assistant, Settings
│   ├── services/        akses data: authService, transactionService, budgetService,
│   │                    migrationService, googleSheetsService, assistantService,
│   │                    supabaseClient, dataMappers
│   ├── utils/
│   │   ├── formatCurrency.js        format Rupiah dan persen
│   │   ├── financeCalculations.js   SEMUA rumus (saldo, saving rate, anggaran, data grafik)
│   │   ├── financeSummary.js        ringkasan angka untuk asisten AI (dipakai frontend + server)
│   │   ├── validation.js            validasi form, data tersimpan, dan file import
│   │   ├── storage.js               baca/tulis localStorage + pembuat ID
│   │   ├── fileExport.js            CSV dan backup JSON
│   │   ├── dates.js, constants.js, demoData.js, formHelpers.js, motion.js
│   ├── App.jsx          state utama, navigasi, penyimpanan
│   ├── main.jsx
│   └── index.css        tema terang/gelap dan style global
├── server/              backend asisten AI (Node.js, tanpa dependensi tambahan)
│   ├── index.js         server HTTP: /api/health dan /api/assistant/ask
│   ├── assistant.js     urutan verifikasi sesi, ambil data, hitung, panggil AI
│   ├── supabaseAuth.js  verifikasi token sesi pengguna ke Supabase Auth
│   ├── supabaseData.js  baca transaksi/anggaran memakai token pengguna (RLS)
│   ├── aiProvider.js    pemanggilan model AI (API key hanya di server)
│   ├── fallbackAnswer.js jawaban tanpa model AI, dari perhitungan aplikasi
│   ├── rateLimit.js     pembatas frekuensi request per pengguna
│   └── env.js           konfigurasi dari environment variables
├── supabase/schema.sql  skema tabel, index, trigger, dan policy RLS
├── google-sheets/Code.gs Apps Script untuk sinkronisasi satu arah
├── docs/                panduan Supabase, Google Sheets, dan asisten AI
└── tests/               test rumus, validasi, CSV, backup, cloud, sheets, asisten AI
```

## Cara kerja penyimpanan lokal

| Key                        | Isi                     |
| -------------------------- | ----------------------- |
| `fintrack_transactions_v1` | daftar transaksi        |
| `fintrack_budgets_v1`      | daftar anggaran         |
| `fintrack_theme_v1`        | `"light"` atau `"dark"` |

- Data dibaca saat aplikasi dimulai dan divalidasi. Item yang rusak diabaikan, aplikasi tidak error.
- Setiap perubahan langsung disimpan. Jika penyimpanan penuh atau diblokir, muncul pesan error.
- Data hanya ada di browser dan profil perangkat ini. Tidak tersinkron, dan menghapus data browser menghapus catatan Anda. **Unduh backup JSON secara berkala** di Pengaturan.
- Jangan simpan data sangat sensitif di perangkat bersama. Tidak ada perlindungan akun atau server.

## Aturan penting

- Jenis transaksi internal: `income` dan `expense`. Nominal selalu angka bulat Rupiah (bukan teks `"Rp35.000"`).
- Saldo = pemasukan - pengeluaran pada periode yang sama. Saving rate = (pemasukan - pengeluaran) / pemasukan x 100%. Jika pemasukan nol, tampil `-` (tidak pernah NaN/Infinity).
- Status anggaran: di bawah 80% Normal, 80% sampai kurang dari 100% Hampir mencapai batas, 100% atau lebih Melewati batas. Hanya pengeluaran dengan kategori dan bulan yang sama yang dihitung.
- Grafik dashboard mengikuti periode: bulan ini (per minggu) atau semua data (per bulan). Tren saldo memakai saldo kumulatif dari seluruh transaksi.
- Export CSV: pemisah kolom titik koma (`;`) dan UTF-8 BOM agar terbuka rapi di Excel berbahasa Indonesia. Sel teks yang diawali `= + - @` dinetralkan agar tidak dibaca sebagai rumus.
- Import JSON divalidasi penuh (struktur, tipe, kategori, id ganda) sebelum data diganti, dengan konfirmasi. Jika tidak valid, data lama tetap aman.
- Keterangan transaksi dirender sebagai teks biasa, tidak pernah sebagai HTML.

## Sinkronisasi Cloud (Supabase)

FinTrack mendukung autentikasi dan sinkronisasi cloud dengan Supabase (PostgreSQL & Supabase Auth). Jika pengguna belum masuk atau Supabase belum dikonfigurasi, aplikasi tetap berjalan lancar dalam **mode lokal** (`localStorage`).

1. Salin file template environment:
   ```bash
   cp .env.example .env
   ```
2. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dari Project Settings > API di Supabase.
3. Eksekusi skema database `supabase/schema.sql` di Supabase SQL Editor (sudah termasuk Row Level Security dan triggers).
4. Panduan langkah demi langkah dapat dibaca di `docs/SUPABASE_SETUP.md`.

## Integrasi Google Sheets

FinTrack menyediakan ekspor dan sinkronisasi satu arah ke Google Sheets secara idempoten (tanpa duplikasi baris transaksi) menggunakan Google Apps Script Web App.

1. Buat spreadsheet baru di Google Sheets.
2. Buka **Extensions** > **Apps Script**, salin isi file `google-sheets/Code.gs`, lalu deploy sebagai **Web app** (Who has access: Anyone).
3. Salin Web app URL ke menu **Pengaturan** di FinTrack.
4. Panduan lengkap dan tangkapan layar tersedia di `docs/GOOGLE_SHEETS_SETUP.md`.

## Asisten AI (AI Financial Assistant)

Halaman **Asisten AI** menjawab pertanyaan seperti "kategori pengeluaran terbesar bulan ini apa?" atau "jika saya ingin menabung 5 juta, berapa bulan yang dibutuhkan?". Fitur ini memerlukan akun cloud (Supabase), karena data dibaca lewat backend memakai sesi pengguna.

Cara kerjanya:

1. Frontend mengirim pertanyaan beserta token sesi ke backend (`server/`) melalui `POST /api/assistant/ask`.
2. Backend memverifikasi token ke Supabase Auth, lalu mengambil transaksi dan anggaran memakai token pengguna itu. Row Level Security Supabase yang membatasi datanya, dan `service_role` key tidak dipakai sama sekali.
3. Angka dihitung fungsi deterministik di `src/utils/financeSummary.js` — modul yang sama dipakai halaman lain — bukan oleh model AI.
4. Hanya ringkasan agregat (total pemasukan/pengeluaran, kategori, status anggaran, rata-rata bulanan) yang dikirim ke model AI. ID transaksi, keterangan transaksi, dan identitas akun tidak pernah dikirim: ada daftar putih eksplisit (`toAiPayload`) dan pemeriksaan tambahan (`validateSummaryForAi`) sebelum request dikirim.
5. Model AI hanya menjelaskan angka tersebut dalam Bahasa Indonesia. Jika model gagal, pesan error yang aman ditampilkan dan data keuangan tidak terpengaruh.

Menjalankan backend:

```bash
npm run server   # http://localhost:8787
```

Variabel `.env` yang dipakai (lihat `.env.example`):

- `AI_PROVIDER_API_KEY` dan `AI_MODEL` — rahasia, hanya dibaca server. Tanpa keduanya, asisten tetap berjalan dalam mode **perhitungan aplikasi**: jawaban disusun langsung dari angka FinTrack tanpa memanggil model AI.
- `AI_BASE_URL` — endpoint bergaya OpenAI (`/chat/completions`). Bawaan `https://api.openai.com/v1`.
- `SUPABASE_URL` dan `SUPABASE_ANON_KEY` — opsional; jika kosong, backend memakai nilai `VITE_SUPABASE_*`.
- `VITE_ASSISTANT_API_URL` — alamat backend yang dipanggil frontend (bawaan `http://localhost:8787`).

Panduan langkah demi langkah: `docs/AI_ASSISTANT_SETUP.md`.

Batasan dan pengamanan versi awal:

- Asisten hanya punya akses baca. Tidak ada operasi tambah, ubah, atau hapus data.
- Pertanyaan maksimal 500 karakter, dan maksimal 15 pertanyaan per 10 menit per pengguna.
- Data dibaca dengan batas periode (3 bulan sebelum periode yang ditanyakan, termasuk bulan pembanding) dan batas 2000 baris. Keterbatasan ini ditampilkan di UI.
- Sebelum chat bisa dipakai, pengguna harus menyetujui pemberitahuan bahwa ringkasan angka diproses oleh penyedia AI. Persetujuan bisa dihentikan kapan saja dari halaman yang sama.
- API key penyedia AI tidak pernah masuk ke bundle frontend maupun ke repository.

## Pengujian

- `npm test`: 112 unit test (rumus keuangan, filter, anggaran, data grafik, validasi, CSV, backup, mapper cloud, konversi UUID idempoten, layanan Google Sheets Web App, ringkasan keuangan untuk asisten AI, dan alur backend asisten AI dengan fetch tiruan: autentikasi, batas frekuensi, periode tanpa data, kegagalan penyedia AI, serta pemeriksaan bahwa data mentah tidak ikut dikirim ke model).
- Uji end-to-end di browser (Playwright) dijalankan saat pengembangan: alur tambah/edit/hapus, validasi, filter, persistensi setelah refresh, export/import, tema, anggaran, dan tidak ada overflow horizontal di 360, 768, dan 1280 px pada mode terang dan gelap.

## Aksesibilitas

Semua input berlabel, error tampil dekat field, fokus keyboard terlihat, dialog memakai `<dialog>` (fokus terkunci, Esc menutup), ikon tombol punya nama aksesibel, status anggaran memakai ikon dan teks (bukan hanya warna), grafik punya legenda dan tabel tersembunyi untuk pembaca layar, serta animasi mengikuti `prefers-reduced-motion`.
