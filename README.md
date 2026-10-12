# FinTrack: Personal Finance Tracker

Website pencatatan keuangan pribadi (frontend saja). Catat pemasukan dan pengeluaran, pantau saldo, atur anggaran per kategori, dan lihat laporan bulanan. Data tersimpan di browser lewat `localStorage`. Tidak ada backend, login, atau database online.

## Instalasi dan menjalankan

Butuh Node.js 20 atau lebih baru.

```bash
npm install
npm run dev       # development, buka alamat yang tampil (biasanya http://localhost:5173)
npm run build     # build produksi ke folder dist/
npm run preview   # coba hasil build
npm test          # unit test (Vitest)
npm run lint      # Oxlint
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
│   │   └── Modal, ConfirmDialog, Field, Toast, navItems
│   ├── pages/           Dashboard, Transactions, Budgets, Reports, Settings
│   ├── utils/
│   │   ├── formatCurrency.js        format Rupiah dan persen
│   │   ├── financeCalculations.js   SEMUA rumus (saldo, saving rate, anggaran, data grafik)
│   │   ├── validation.js            validasi form, data tersimpan, dan file import
│   │   ├── storage.js               baca/tulis localStorage + pembuat ID
│   │   ├── fileExport.js            CSV dan backup JSON
│   │   ├── dates.js, constants.js, demoData.js, formHelpers.js, motion.js
│   ├── App.jsx          state utama, navigasi, penyimpanan
│   ├── main.jsx
│   └── index.css        tema terang/gelap dan style global
└── tests/               test rumus, validasi, CSV, backup
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

## Pengujian

- `npm test`: 42 unit test (rumus, filter, anggaran, data grafik, validasi, CSV, backup, format angka).
- Uji end-to-end di browser (Playwright) dijalankan saat pengembangan: alur tambah/edit/hapus, validasi, filter, persistensi setelah refresh, export/import, tema, anggaran, dan tidak ada overflow horizontal di 360, 768, dan 1280 px pada mode terang dan gelap.

## Aksesibilitas

Semua input berlabel, error tampil dekat field, fokus keyboard terlihat, dialog memakai `<dialog>` (fokus terkunci, Esc menutup), ikon tombol punya nama aksesibel, status anggaran memakai ikon dan teks (bukan hanya warna), grafik punya legenda dan tabel tersembunyi untuk pembaca layar, serta animasi mengikuti `prefers-reduced-motion`.
