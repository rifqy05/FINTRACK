# Panduan Konfigurasi Asisten AI FinTrack

Dokumen ini menjelaskan cara mengaktifkan halaman **Asisten AI** (AI Financial Assistant) pada FinTrack, termasuk langkah manual yang harus Anda lakukan sendiri.

Asisten ini bersifat opsional. Aplikasi FinTrack tetap berjalan normal tanpa backend ini, dan asisten bisa dipakai dalam dua mode:

| Mode | Syarat | Jawaban dihasilkan oleh |
| --- | --- | --- |
| Perhitungan aplikasi | Backend jalan, tanpa API key AI | Fungsi keuangan FinTrack (`server/fallbackAnswer.js`) |
| AI | Backend jalan + `AI_PROVIDER_API_KEY` + `AI_MODEL` | Model AI, memakai angka yang dihitung FinTrack |

---

## Langkah 1: Pastikan Supabase sudah dikonfigurasi

Asisten membaca transaksi dan anggaran dari akun cloud, jadi ikuti dulu `docs/SUPABASE_SETUP.md` sampai Anda bisa login dan menyimpan transaksi di FinTrack.

Backend memakai **token sesi pengguna + anon key**, bukan `service_role` key. Anda tidak perlu menyalin `service_role` key ke mana pun.

---

## Langkah 2: Isi `.env`

Di folder proyek FinTrack, salin contoh dan isi nilainya:

```bash
cp .env.example .env
```

Bagian frontend (nilai publik, boleh ada di browser):

```dotenv
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_ASSISTANT_API_URL=http://localhost:8787
```

Bagian backend (dibaca hanya oleh server):

```dotenv
SUPABASE_URL=
SUPABASE_ANON_KEY=

AI_PROVIDER_API_KEY=
AI_MODEL=
AI_BASE_URL=https://api.openai.com/v1
```

Catatan:

- `SUPABASE_URL` dan `SUPABASE_ANON_KEY` boleh dikosongkan; backend akan memakai `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` karena keduanya memang nilai publik.
- **Jangan** memakai awalan `VITE_` untuk `AI_PROVIDER_API_KEY`. Semua variabel berawalan `VITE_` ikut ter-bundle ke browser.
- Jangan pernah mengirim API key ke dalam percakapan atau commit. Isi langsung di berkas `.env` lokal Anda (berkas ini sudah masuk `.gitignore`).

---

## Langkah 3: Jalankan backend

Di terminal terpisah:

```bash
npm run server
```

Contoh keluaran:

```text
FinTrack Assistant API berjalan.
Alamat   : http://localhost:8787
Konfigurasi: {"port":8787,"supabase":"terkonfigurasi","penyediaAi":"aktif (...)"}
```

Periksa cepat tanpa membuka browser:

```bash
curl http://localhost:8787/api/health
```

Jika `penyediaAi` bernilai `belum dikonfigurasi`, asisten tetap bisa dipakai dalam mode perhitungan aplikasi.

---

## Langkah 4: Jalankan frontend dan uji

```bash
npm run dev
```

1. Masuk ke akun cloud FinTrack Anda (tombol **Masuk Cloud** di sidebar).
2. Buka menu **Asisten AI**.
3. Setujui pemberitahuan privasi sekali. Setelah itu kolom pertanyaan aktif.
4. Coba salah satu pertanyaan contoh, misalnya "kategori pengeluaran terbesar bulan ini apa?".

Setiap jawaban menampilkan periode data yang dianalisis beserta jumlah transaksinya.

---

## Apa yang dikirim ke penyedia AI

Hanya ringkasan agregat bulan terkait:

- total pemasukan, pengeluaran, selisih, saving rate;
- daftar kategori pengeluaran/pemasukan teratas beserta nominal dan porsinya;
- kategori yang naik/turun dibanding bulan sebelumnya;
- status anggaran bulan itu;
- rata-rata bulanan 3 bulan sebelumnya (untuk simulasi menabung).

Tidak dikirim: ID transaksi, keterangan transaksi, nama/metode pembayaran, email, dan user id. Daftar putih ada di `toAiPayload()` dan diperiksa lagi oleh `validateSummaryForAi()` di `src/utils/financeSummary.js` sebelum request dikirim.

Model AI hanya menjelaskan angka. Perhitungan angka selalu dilakukan modul yang sama dengan yang dipakai dashboard, anggaran, dan laporan.

---

## Batas versi awal

- Hanya baca. Asisten tidak bisa menambah, mengubah, atau menghapus transaksi.
- Pertanyaan maksimal `AI_MAX_QUESTION_LENGTH` (bawaan 500) karakter.
- Maksimal `AI_RATE_LIMIT_MAX` (bawaan 15) pertanyaan per `AI_RATE_LIMIT_WINDOW_MS` (bawaan 10 menit) per pengguna. Pembatas ini disimpan di memori proses, jadi akan tereset saat server dijalankan ulang dan tidak berlaku lintas instance.
- Data dibaca sejak `AI_DATA_MONTHS_BACK` (bawaan 3) bulan sebelum periode yang ditanyakan, maksimal `AI_DATA_ROW_LIMIT` (bawaan 2000) baris. Bila terpotong, UI memberi tahu.
- Asisten menganalisis bulan berjalan (atau bulan yang dikirim frontend). Pemilih bulan belum ada di UI.
- Belum ada riwayat percakapan yang disimpan; percakapan hilang saat halaman dimuat ulang.

---

## Troubleshooting

**"Backend tidak terhubung"** — backend belum jalan atau alamatnya berbeda. Jalankan `npm run server`, lalu periksa `VITE_ASSISTANT_API_URL`. Jika backend jalan di port lain, ubah `PORT` dan `VITE_ASSISTANT_API_URL` agar sama.

**"Sesi tidak valid atau sudah berakhir"** — token sesi kedaluwarsa. Keluar lalu masuk lagi di FinTrack.

**"Backend belum dikonfigurasi: SUPABASE_URL dan SUPABASE_ANON_KEY belum diisi"** — isi kedua variabel itu di `.env` (atau isi `VITE_SUPABASE_*` sebagai gantinya), lalu jalankan ulang `npm run server`.

**"Permintaan ke penyedia AI ditolak"** — `AI_PROVIDER_API_KEY` salah atau tidak aktif. Periksa juga `AI_BASE_URL` dan `AI_MODEL` sesuai penyedia yang Anda pakai.

**"Batas penggunaan penyedia AI sedang tercapai"** — kuota penyedia Anda kena limit atau saldo habis. Data FinTrack tidak terpengaruh.

**Jawaban tidak muncul saat `npm run build`** — pastikan `VITE_ASSISTANT_API_URL` diisi saat build bila frontend dan backend tidak berjalan di host yang sama, karena nilai `VITE_*` ditanam saat build.

**Ingin menghentikan pengiriman data ke AI** — buka halaman Asisten AI dan klik **Hentikan persetujuan ini**. Selama belum disetujui lagi, chat tidak bisa dipakai.
