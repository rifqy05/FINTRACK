# Panduan Konfigurasi Supabase FinTrack

Dokumen ini berisi panduan langkah demi langkah untuk membuat dan mengonfigurasi proyek Supabase untuk FinTrack.

---

## Langkah 1: Buat Akun & Proyek Supabase

1. Kunjungi [supabase.com](https://supabase.com) dan masuk (login/sign up).
2. Di dashboard Supabase, klik tombol **New Project**.
3. Isi informasi proyek:
   - **Name:** `fintrack` (atau nama yang Anda inginkan)
   - **Database Password:** Buat password yang kuat dan simpan di pengelola kata sandi Anda.
   - **Region:** Pilih region terdekat (misalnya: *Singapore* untuk pengguna di Indonesia).
   - **Pricing Plan:** Free plan sudah lebih dari cukup.
4. Klik **Create new project** dan tunggu proses inisialisasi (~1-2 menit).

---

## Langkah 2: Eksekusi Skema SQL (Tabel, RLS, Indexes, Triggers)

1. Di menu sidebar kiri dashboard Supabase, klik ikon **SQL Editor** (atau buka menu *SQL*).
2. Klik **New query**.
3. Buka file `supabase/schema.sql` di proyek ini, lalu salin (copy) seluruh isinya.
4. Tempel (paste) kode SQL tersebut ke SQL Editor Supabase.
5. Klik tombol **Run** (atau tekan `Ctrl + Enter`).
6. Pastikan muncul pesan sukses: `Success. No rows returned`.

> **Catatan Keamanan:**
> Skema tersebut otomatis mengaktifkan **Row Level Security (RLS)** pada tabel `transactions` dan `budgets`. Data Anda akan terisolasi sepenuhnya dan hanya bisa dibaca/diubah oleh pengguna yang memiliki sesi login (`auth.uid()`).

---

## Langkah 3: Ambil Kredensial API

1. Di menu sidebar kiri dashboard Supabase, klik ikon gear **Project Settings**.
2. Masuk ke submenu **API** (atau **Data API**).
3. Cari bagian:
   - **Project URL:** Salin URL proyek (contoh: `https://abcdefghijklm.supabase.co`).
   - **Project API keys > `anon` `public`:** Salin API key publik ini.
4. ⚠️ **PERINGATAN:** Jangan pernah menyalin atau menggunakan `service_role` key pada kode frontend. Hanya gunakan `anon` key.

---

## Langkah 4: Buat File `.env` di Proyek Lokal

1. Di folder proyek FinTrack (`D:\Magang\projek gabut\fintrack\`), buat file baru bernama `.env` (bisa duplikat dari `.env.example`).
2. Masukkan URL dan anon key yang sudah disalin:
   ```dotenv
   VITE_SUPABASE_URL=https://abcdefghijklm.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Simpan file `.env`. File ini sudah otomatis dimasukkan ke `.gitignore` sehingga tidak akan terunggah ke repositori publik.

---

## Langkah 5: Pengaturan Supabase Auth (Email/Password)

1. Di dashboard Supabase, buka menu **Authentication** > **Providers** > **Email**.
2. Pastikan **Enable Email provider** aktif (posisi ON).
3. *(Opsional untuk kemudahan pengujian lokal):*
   - Pada bagian **Confirm email**, Anda dapat mematikan (OFF) pilihan **Confirm email** jika ingin dapat langsung login tanpa harus klik link verifikasi di email asli selama masa pengujian.
   - Klik **Save**.
