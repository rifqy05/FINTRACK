# Catatan P3 - Penyempurnaan

Dokumen ini mencatat apa yang benar-benar dijalankan dan diukur pada tahap P3,
bukan rencana. Semua angka di bawah berasal dari perintah dan audit yang
dijalankan langsung terhadap aplikasi.

## 1. UX status sinkronisasi

Sebelum P3, indikator sinkronisasi hanya berupa label pasif di Header dan
berbeda antara tampilan ponsel dan desktop.

Yang ditambahkan:

- `src/utils/syncState.js` - satu sumber logika status: label, nada warna,
  waktu simpan terakhir, dan apakah status bisa dicoba ulang. Murni tanpa React
  sehingga bisa diuji langsung.
- `src/components/SyncStatus.jsx` - satu komponen indikator yang dipakai Header
  (ponsel dan desktop) serta halaman Pengaturan, sehingga label tidak lagi
  berbeda antar tempat.
- Status baru `offline`, dibedakan dari `error`. Perangkat offline bukan
  kegagalan data, dan pesannya menjelaskan bahwa perubahan tetap aman di
  perangkat.
- Waktu simpan terakhir ditampilkan pada status `saved` (contoh: "Tersimpan 11.04").
- Tombol "Coba lagi" muncul untuk status `error` dan `offline`, memanggil ulang
  pengambilan data dari cloud.
- `navigator.onLine` dipantau lewat event `online`/`offline`; saat koneksi
  kembali dan pengguna sedang login, data ditarik ulang otomatis.
- Setiap operasi tulis ke cloud mencatat waktunya lewat `markSaved()`.

Catatan: status `offline` hanya muncul saat pengguna login ke cloud. Dalam mode
lokal, data memang hanya ada di perangkat, jadi labelnya tetap "Mode lokal".

## 2. Aksesibilitas dan mobile

Audit dijalankan dengan axe-core 4.10.2 (tag wcag2a, wcag2aa, wcag21a,
wcag21aa) terhadap aplikasi yang benar-benar berjalan di `npm run dev`.

Cakupan: 6 halaman (Dashboard, Transaksi, Anggaran, Laporan, Asisten,
Pengaturan) dan 4 dialog (Masuk Cloud, Tambah Transaksi, Google Sheets,
Konfirmasi Hapus), pada tema terang dan gelap.

Dua pelanggaran nyata ditemukan dan diperbaiki:

1. `aria-hidden-focus` (serious) di halaman Laporan. Recharts memberi
   `tabindex="0"` pada elemen `<svg>` di dalam pembungkus `aria-hidden="true"`,
   sehingga ada elemen yang bisa difokus keyboard tetapi tersembunyi dari
   pembaca layar. Diperbaiki dengan `tabIndex={-1} focusable="false"` pada
   BarChart, LineChart, dan PieChart. Data grafik tetap terbaca lewat tabel
   tersembunyi yang sudah ada.

2. `color-contrast` (serious) pada tombol pilihan jenis transaksi. Warna
   `--expense` (#c2372d) di atas `--expense-soft` (#fbe4e1) hanya mencapai rasio
   4.46:1, di bawah ambang 4.5:1 untuk teks 14px. Nilai diperbaiki menjadi
   #b02a20 (5.41:1). `--income` juga dinaikkan dari #047857 ke #046b4d
   (4.72:1 -> 5.62:1) karena berada di ambang batas yang sama.

Hasil setelah perbaikan: 0 pelanggaran pada 10 kombinasi halaman dan dialog di
tema terang, dan 0 pelanggaran pada 8 kombinasi di tema gelap.

Pemeriksaan mobile pada lebar 360px dan 320px: 0px overflow horizontal dan 0
sasaran sentuh di bawah 44px pada keenam halaman.

## 3. Perbaikan teknis pendukung

- `Modal.jsx` memakai `id="modal-title"` yang sama untuk semua dialog. Diganti
  dengan `useId()` sehingga setiap dialog punya id unik. Ini mencegah
  `aria-labelledby` menunjuk judul dialog yang salah ketika dua dialog pernah
  ada bersamaan.
- Efek `onAuthStateChange` sebelumnya ikut berlangganan ulang setiap kali
  penanda `localDataPrompted` berubah, sehingga pengambilan data cloud bisa
  terpicu ulang. Penanda dipindah ke `useRef`.
- Tombol "Keluar" dan "Masuk Cloud" di baris atas ponsel dinaikkan ke tinggi
  minimum 44px.

## 4. Hasil gerbang mutu

- `npm test`: 8 berkas, 121 tes lulus (sebelumnya 112; 9 tes baru di
  `tests/syncState.test.js`).
- `npm run lint`: oxlint bersih, tanpa peringatan.
- `npm run build`: berhasil.
- `npm run server` + `GET /api/health`: server asisten merespons dengan payload
  JSON yang benar.

## 5. Belum dikerjakan (sengaja)

- **PWA / offline.** PRD menyebut ini hanya jika benar-benar dibutuhkan.
  Aplikasi sudah menangani status offline dengan jujur tanpa service worker,
  dan menambahkan PWA berarti menambah kompleksitas caching yang belum ada
  kebutuhannya.
- **Code splitting.** Bundel masih 928 kB (269 kB gzip) dalam satu berkas dan
  Vite masih mengeluarkan peringatan chunk >500 kB. Recharts adalah penyumbang
  terbesar. Memecahnya akan mempercepat muat pertama di ponsel, tetapi ini
  perubahan struktur yang lebih besar dan sebaiknya dikerjakan sebagai langkah
  tersendiri dengan pengukuran sebelum/sesudah.
- **MCP.** PRD menyebut evaluasi MCP setelah asisten AI dasar stabil.
