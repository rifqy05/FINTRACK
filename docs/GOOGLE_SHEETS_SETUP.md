# Panduan Integrasi Google Sheets FinTrack

Dokumen ini menjelaskan langkah-langkah menghubungkan FinTrack ke Google Sheets untuk melakukan sinkronisasi transaksi satu arah secara otomatis dan idempoten (tanpa duplikasi).

---

## Mengapa Pendekatan Google Apps Script?
- **Aman & Terisolasi:** Spreadsheet berada 100% di Google Drive milik Anda sendiri. FinTrack tidak pernah meminta izin akses ke seluruh akun Google Drive Anda.
- **Idempoten:** Script memeriksa kolom `Transaction ID`. Jika transaksi sudah pernah dikirim, script hanya memperbarui baris tersebut; jika belum ada, script menambahkan baris baru.
- **Tanpa Kredensial Rumit:** Tidak memerlukan Google Cloud Console API project, OAuth consent screen, atau domain terverifikasi.

---

## Langkah 1: Buat Spreadsheet Baru
1. Buka [Google Sheets](https://sheets.new) di browser Anda.
2. Beri nama spreadsheet, misalnya: `FinTrack - Rekap Keuangan`.

---

## Langkah 2: Pasang Kode Apps Script
1. Di menu atas spreadsheet, klik **Extensions** (Ekstensi) > **Apps Script**.
2. Hapus semua kode default di dalam berkas `Code.gs`.
3. Buka berkas `google-sheets/Code.gs` yang ada di proyek ini, salin seluruh kodenya, lalu tempelkan ke editor Google Apps Script.
4. *(Wajib)* Pada bagian:
   ```javascript
   var CONFIG_SECRET_TOKEN = "fintrack-secret-token-change-me";
   ```
   Ubah nilai tersebut menjadi token rahasia pilihan Anda (contoh: `kunciku12345`). Script akan menolak permintaan bila token masih memakai nilai bawaan.
5. Klik ikon disket **Save project** (atau tekan `Ctrl + S`).

---

## Langkah 3: Deploy sebagai Web App
1. Di pojok kanan atas editor Apps Script, klik tombol **Deploy** > **New deployment**.
2. Klik ikon gear di sebelah "Select type", lalu pilih **Web app**.
3. Isi konfigurasi berikut:
   - **Description:** `FinTrack Sync`
   - **Execute as:** `Me (email-anda@gmail.com)`
   - **Who has access:** `Anyone` *(Wajib "Anyone" agar browser Anda dapat mengirim data transaksi ke script ini)*
4. Klik tombol **Deploy**.
5. Jika muncul jendela permintaan izin:
   - Klik **Authorize access**.
   - Pilih akun Google Anda.
   - Jika muncul peringatan *"Google hasn't verified this app"*, klik **Advanced** di pojok kiri bawah, lalu klik **Go to FinTrack (unsafe)**.
   - Klik **Allow**.
6. Salin **Web app URL** yang muncul (format: `https://script.google.com/macros/s/AKfycb.../exec`).

---

## Langkah 4: Hubungkan ke FinTrack
1. Buka aplikasi FinTrack Anda, masuk ke menu **Pengaturan** (`Settings`).
2. Gulir ke bagian **Integrasi Google Sheets**, lalu klik **Hubungkan Google Sheets**.
3. Masukkan:
   - **Web App URL:** Tempelkan URL yang sudah disalin di Langkah 3.
   - **Secret Token:** Masukkan token yang sama dengan yang Anda buat di Langkah 2.
4. Klik tombol **Uji Koneksi**.
5. Jika muncul pesan *"Koneksi berhasil"*, klik **Simpan Konfigurasi**.
6. Sekarang Anda dapat menekan tombol **Sinkronkan Sekarang** kapan saja untuk mengirim transaksi ke spreadsheet!
