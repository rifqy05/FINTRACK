# PRD Pembaruan FinTrack

## Sinkronisasi Cloud, Integrasi Google Sheets, dan AI Financial Assistant

**Versi:** 1.0\
**Tanggal:** 12 Oktober 2026\
**Jenis dokumen:** Product Requirements Document (PRD)\
**Produk:** FinTrack --- aplikasi keuangan pribadi berbasis web

------------------------------------------------------------------------

## 1. Ringkasan Produk

FinTrack adalah aplikasi keuangan pribadi berbasis React dan Vite yang
saat ini menyediakan dashboard, pencatatan pemasukan dan pengeluaran,
pengelolaan anggaran, laporan, grafik, pengaturan, ekspor data, serta
penyimpanan lokal menggunakan `localStorage`.

Pembaruan ini bertujuan mengembangkan FinTrack menjadi aplikasi yang
dapat digunakan lintas perangkat dengan autentikasi dan penyimpanan
cloud, mengekspor atau menyinkronkan transaksi ke Google Sheets, serta
menyediakan AI Financial Assistant yang menjawab pertanyaan berdasarkan
data keuangan pengguna.

Pembaruan harus dilakukan secara bertahap di atas kode yang sudah ada.
Jangan membangun ulang aplikasi dari nol, mengganti tampilan tanpa
alasan, atau menambahkan kompleksitas yang belum diperlukan.

## 2. Tujuan

1.  Mempertahankan seluruh fungsi FinTrack yang sudah berjalan.
2.  Menambahkan autentikasi pengguna dan penyimpanan cloud yang aman.
3.  Memungkinkan pengguna memigrasikan data lama dari `localStorage` ke
    akun cloud.
4.  Menyediakan ekspor/sinkronisasi transaksi ke Google Sheets.
5.  Menambahkan AI assistant untuk meringkas dan menganalisis keuangan
    pribadi.
6.  Menjaga akurasi perhitungan finansial, privasi data, kemudahan
    penggunaan, dan kemudahan pemeliharaan kode.
7.  Memastikan aplikasi tetap bisa diuji secara lokal dan dapat
    dikembangkan oleh mahasiswa dengan pemahaman dasar React dan
    JavaScript.

## 3. Bukan Tujuan (Out of Scope)

Untuk versi awal, jangan mengimplementasikan hal-hal berikut kecuali
diminta secara terpisah:

-   Integrasi langsung ke rekening bank atau pengambilan mutasi otomatis
    dari bank.
-   Pembayaran, transfer uang, atau transaksi finansial nyata.
-   Sinkronisasi dua arah Google Sheets dan database.
-   AI agent yang dapat menghapus atau mengubah transaksi tanpa
    persetujuan pengguna.
-   MCP server pada tahap awal.
-   Arsitektur microservices, message broker, Kubernetes, atau
    infrastruktur enterprise.
-   Fitur investasi, saham, pinjaman, pajak, dan akuntansi bisnis.
-   Aplikasi mobile native Android/iOS.
-   Langganan berbayar atau multi-tenant untuk pelanggan eksternal.

## 4. Kondisi Proyek Saat Ini

Source code awal memiliki struktur React + Vite dengan JavaScript dan
komponen UI terpisah. Bagian yang perlu dipertahankan dan diperiksa
sebelum modifikasi mencakup:

-   `src/App.jsx`
-   `src/pages/` untuk Dashboard, Transactions, Budgets, Reports, dan
    Settings
-   `src/components/` untuk form, tabel, grafik, kartu ringkasan, modal,
    toast, dan navigasi
-   `src/utils/storage.js` untuk penyimpanan lokal
-   `src/utils/financeCalculations.js` untuk perhitungan keuangan
-   `src/utils/validation.js` untuk validasi
-   `src/utils/fileExport.js` untuk ekspor
-   `src/utils/dates.js` dan `src/utils/formatCurrency.js`
-   `tests/` untuk pengujian otomatis
-   `package.json`, konfigurasi Vite, lint, dan formatter

AI coding assistant wajib membaca `README.md`, `package.json`, serta
file yang relevan sebelum melakukan perubahan. Jangan berasumsi bahwa
nama fungsi atau struktur internal persis sama dengan rancangan PRD;
verifikasi terlebih dahulu dari source code aktual.

## 5. Pengguna dan Skenario Utama

Pengguna utama adalah satu orang yang ingin mengelola keuangan
pribadinya dari laptop atau perangkat lain.

Skenario utama:

1.  Pengguna mencatat pemasukan atau pengeluaran di FinTrack.
2.  Data disimpan di database cloud setelah pengguna login.
3.  Dashboard, anggaran, dan laporan menghitung data yang sama secara
    konsisten.
4.  Pengguna dapat menghubungkan spreadsheet Google untuk membuat rekap.
5.  Pengguna bertanya kepada AI, misalnya "Kategori pengeluaran terbesar
    bulan ini apa?"
6.  AI memberikan jawaban berdasarkan hasil perhitungan aplikasi, bukan
    angka yang dikarang.
7.  Jika layanan Google Sheets atau AI sedang gagal, transaksi yang
    sudah berhasil disimpan ke database tetap aman.

## 6. Prinsip Arsitektur

### 6.1 Sumber data utama

Gunakan Supabase (PostgreSQL dan Supabase Auth) sebagai sumber data
utama setelah migrasi cloud selesai.

Google Sheets berfungsi sebagai tujuan ekspor dan rekap, bukan sumber
data utama. Pada versi awal, perubahan di Google Sheets tidak otomatis
menimpa database FinTrack.

`localStorage` tetap digunakan hanya untuk kebutuhan yang sesuai,
misalnya preferensi UI atau sebagai sumber data lama yang perlu
dimigrasikan. Jangan menjadikan `localStorage` dan Supabase sebagai dua
sumber data utama yang sama-sama dapat berubah tanpa aturan konflik.

### 6.2 Stack yang dipertahankan

-   Frontend: React + Vite + JavaScript sesuai proyek yang sudah ada.
-   Database dan autentikasi: Supabase.
-   Spreadsheet: Google Sheets API atau pendekatan Google Apps Script
    yang dinilai paling sederhana dan aman.
-   Backend AI: satu backend API ringan untuk menyimpan API key dan
    memanggil model AI.
-   Pengujian: pertahankan framework test yang sudah terpasang, termasuk
    Vitest jika memang digunakan oleh proyek.
-   Deployment: pilih layanan sederhana yang kompatibel dengan frontend
    dan backend; dokumentasikan pilihan sebelum menerapkannya.

Jangan mengganti JavaScript menjadi TypeScript, mengganti library UI,
atau menambahkan state management besar kecuali ada alasan teknis yang
jelas dan disetujui.

### 6.3 Batas keamanan

-   Jangan menaruh Supabase service-role key, Google client secret,
    refresh token sensitif, atau API key model AI di kode frontend.
-   Variabel frontend hanya boleh berisi konfigurasi publik yang memang
    aman untuk diekspos, misalnya Supabase URL dan anon/publishable key
    dengan RLS yang benar.
-   Semua tabel yang berisi data pengguna harus dilindungi oleh Row
    Level Security (RLS).
-   Backend harus memverifikasi identitas pengguna dan hanya mengakses
    data yang diizinkan untuk pengguna tersebut.
-   Jangan mengirim seluruh riwayat transaksi ke model AI jika ringkasan
    agregat sudah cukup.
-   Jangan mencatat API key, token, atau isi transaksi sensitif ke log.
-   Berikan pesan error yang aman dan tidak membocorkan detail internal.

## 7. Kebutuhan Fungsional

### FR-01 --- Autentikasi

Pengguna dapat: - Membuat akun dan login menggunakan metode yang
didukung konfigurasi Supabase. - Logout dengan aman. - Melihat status
sesi login. - Mendapatkan pesan yang jelas saat autentikasi gagal. -
Mengakses data keuangan miliknya sendiri saja.

Untuk versi awal, email/password dapat digunakan. OAuth Google boleh
ditambahkan jika konfigurasi dan kebutuhan produk mendukungnya, tetapi
jangan menjadikan OAuth sebagai penghalang untuk menyelesaikan
autentikasi dasar.

**Kriteria penerimaan:** - Pengguna yang belum login tidak dapat membuka
data pribadi dari database. - Pengguna A tidak dapat membaca, mengubah,
atau menghapus transaksi pengguna B. - Status login dan logout ditangani
dengan benar. - Tidak ada kredensial rahasia yang ditanam di bundle
frontend.

### FR-02 --- Database dan skema

Buat migrasi SQL yang terdokumentasi untuk tabel minimum berikut:

**`transactions`** - `id`: UUID primary key. - `user_id`: UUID pemilik
data, terkait dengan identitas Supabase. - `type`: `income` atau
`expense`. - `amount`: integer/bigint positif dalam Rupiah. -
`category`: teks kategori. - `date`: tanggal transaksi. - `description`:
teks opsional. - `created_at` dan `updated_at`: timestamp. - Tambahkan
kolom tambahan hanya jika dibutuhkan oleh model data yang sudah ada,
misalnya `notes` atau `source`.

**`budgets`** - `id`: UUID primary key. - `user_id`: UUID pemilik. -
`month`: representasi periode yang konsisten. - `category`: kategori
anggaran. - `limit_amount`: integer/bigint positif. - `created_at` dan
`updated_at`.

Tambahkan constraint yang relevan, indeks untuk query berdasarkan
`user_id` dan tanggal, serta aturan unik untuk mencegah anggaran ganda
pada kombinasi pengguna, periode, dan kategori.

Tabel integrasi hanya dibuat jika diperlukan. Jangan menyimpan secret
OAuth di tabel pengaturan biasa. Jika nantinya token OAuth perlu
disimpan, gunakan mekanisme server-side yang aman dan minimalkan cakupan
aksesnya.

**Kriteria penerimaan:** - Skema dapat diterapkan dari file migrasi SQL
yang tersedia di repository. - RLS aktif dan policy diuji. - Nominal
Rupiah disimpan tanpa pecahan. - Relasi dan constraint mencegah data
yang tidak valid.

### FR-03 --- Repository dan layanan data

Pisahkan UI dari detail penyimpanan. Halaman React tidak boleh mengakses
Supabase secara langsung di banyak tempat.

Buat repository atau service dengan fungsi yang sesuai dengan pola kode
aktual, seperti: - mengambil transaksi berdasarkan periode; - menambah
transaksi; - memperbarui transaksi; - menghapus transaksi; - mengambil
dan memperbarui anggaran; - mendapatkan ringkasan yang diperlukan
dashboard.

Nama fungsi boleh disesuaikan dengan struktur kode aktual. Hindari
abstraksi berlebihan dan jangan membuat repository generik kompleks jika
dua implementasi sederhana sudah cukup.

**Kriteria penerimaan:** - Halaman UI menggunakan service/repository,
bukan query database yang tersebar di setiap komponen. - Perhitungan
finansial tetap terpusat di modul perhitungan yang sudah ada. - Loading,
empty state, dan error state terlihat jelas. - Operasi gagal tidak
ditampilkan sebagai berhasil.

### FR-04 --- Migrasi data lokal ke cloud

Buat alur migrasi yang aman untuk pengguna yang sudah memiliki data di
`localStorage`.

Alur: 1. Deteksi apakah data lokal lama tersedia. 2. Tampilkan jumlah
transaksi dan anggaran yang akan dimigrasikan. 3. Minta pengguna login
terlebih dahulu. 4. Minta konfirmasi sebelum migrasi. 5. Validasi data
sebelum dikirim. 6. Gunakan ID yang stabil atau strategi idempotensi
agar proses ulang tidak menggandakan data. 7. Tampilkan hasil
sukses/gagal dan sediakan cara mengunduh backup. 8. Jangan menghapus
data lokal secara otomatis setelah migrasi berhasil.

**Kriteria penerimaan:** - Migrasi dapat diulang tanpa membuat
duplikat. - Data tidak dihapus dari browser tanpa persetujuan. - Data
tidak valid dilaporkan secara jelas dan tidak diam-diam dibuang. -
Jumlah dan nominal data sebelum dan sesudah migrasi dapat diverifikasi.

### FR-05 --- Sinkronisasi cloud

Setelah pengguna login, data utama dibaca dan ditulis ke Supabase.

Untuk versi awal: - Tidak wajib mendukung offline editing penuh. -
Tampilkan indikator `Tersimpan`, `Menyimpan`, atau `Gagal menyimpan`
yang akurat. - Jika jaringan gagal, tampilkan tindakan untuk mencoba
kembali. - Jangan menyatakan data sudah tersinkron sebelum server
mengonfirmasi keberhasilan. - Pertahankan backup JSON/CSV yang sudah
ada.

**Kriteria penerimaan:** - Transaksi yang tersimpan muncul saat pengguna
login di browser/perangkat lain. - Refresh halaman tidak menghilangkan
data cloud. - Error jaringan tidak membuat UI menganggap perubahan
berhasil. - Tidak ada konflik tersembunyi antara cache lokal dan data
server.

### FR-06 --- Integrasi Google Sheets

Pengguna dapat menghubungkan atau mengonfigurasi spreadsheet dan
mengirim data transaksi ke sheet yang ditentukan.

Kolom spreadsheet minimum: - Transaction ID - Date - Type - Category -
Description - Amount (IDR) - Last Updated

Fitur minimum: - Tombol "Hubungkan Google Sheets" atau alur konfigurasi
yang dipilih. - Tombol "Sinkronkan sekarang". - Status terakhir
sinkronisasi. - Jumlah baris yang berhasil dikirim dan jumlah yang
gagal. - Penanganan izin dicabut, spreadsheet tidak ditemukan, jaringan
gagal, dan batas API. - Sinkronisasi ulang tidak membuat baris
duplikat. - Sinkronisasi satu arah dari FinTrack/database ke Sheets.

Implementasi harus memilih salah satu pendekatan dan menjelaskan
alasannya: 1. Google Sheets API melalui backend dengan OAuth yang
sesuai; atau 2. Google Apps Script dengan pembatasan akses yang aman dan
didokumentasikan.

Jangan menyimpan token rahasia di frontend atau menganggap URL
spreadsheet saja sebagai otorisasi. Jangan meminta akses Google yang
lebih luas daripada yang diperlukan.

**Kriteria penerimaan:** - Pengguna dapat mengekspor transaksi ke
spreadsheet yang diizinkan. - Pengiriman ulang tidak menggandakan
transaksi yang sama. - Data di database tetap aman saat sinkronisasi
gagal. - Pengguna bisa mengetahui waktu dan status sinkronisasi
terakhir. - Instruksi konfigurasi Google tersedia di README.

### FR-07 --- AI Financial Assistant

Tambahkan halaman atau panel chat yang sesuai dengan desain FinTrack
saat ini.

Pertanyaan awal yang didukung: - "Berapa total pemasukan dan pengeluaran
bulan ini?" - "Kategori pengeluaran terbesar bulan ini apa?" -
"Bandingkan pengeluaran bulan ini dengan bulan sebelumnya." - "Kategori
apa yang paling meningkat?" - "Bagaimana status anggaran saya?" - "Jika
saya ingin menabung sejumlah tertentu, berikan simulasi penghematan."

Alur: 1. Frontend mengirim pertanyaan ke backend. 2. Backend
memverifikasi pengguna. 3. Backend mengambil data relevan dengan batas
periode dan jumlah data yang wajar. 4. Fungsi keuangan yang
deterministik menghitung angka dan ringkasan. 5. Backend mengirim
ringkasan minimum yang dibutuhkan ke model AI. 6. AI menyampaikan
penjelasan dalam Bahasa Indonesia. 7. UI menampilkan jawaban, status
loading, dan error jika permintaan gagal.

Batasan: - AI bukan sumber kebenaran untuk saldo atau perhitungan
nominal. - Perhitungan angka harus berasal dari kode FinTrack/database,
bukan perkiraan model. - AI tidak boleh mengarang transaksi atau
mengklaim telah melakukan perubahan data. - Versi awal hanya memiliki
izin baca. - Jangan mengirim data ke layanan AI sebelum pengguna
mengetahui bahwa fitur tersebut memproses data melalui penyedia AI. -
Jangan mengirim informasi pribadi yang tidak diperlukan. - Batasi
panjang input, frekuensi request, dan biaya penggunaan. - Tampilkan
periode data yang dianalisis dan jelaskan bila data tidak lengkap.

**Kriteria penerimaan:** - Jawaban angka cocok dengan hasil fungsi
perhitungan yang diuji. - Pertanyaan tentang periode tanpa data
menghasilkan jawaban yang jelas. - Kegagalan model AI tidak memengaruhi
data keuangan. - API key hanya berada di server. - Pengguna tidak bisa
meminta backend membaca transaksi milik pengguna lain melalui manipulasi
request.

### FR-08 --- Pengujian dan kualitas

Pertahankan test yang sudah ada. Tambahkan pengujian untuk: -
perhitungan saldo dan ringkasan; - validasi transaksi dan anggaran; -
repository menggunakan mock; - migrasi lokal; - idempotensi
sinkronisasi; - penanganan error Google Sheets; - autentikasi dan akses
pengguna; - validasi ringkasan sebelum dikirim ke AI; - kasus kosong,
tanggal batas bulan, dan nominal besar.

Jangan menggunakan data keuangan nyata di fixture atau log pengujian.
Buat data dummy yang tidak sensitif.

### FR-09 --- Dokumentasi

Perbarui README dengan: - persyaratan Node.js dan perintah instalasi; -
cara menjalankan development server; - konfigurasi Supabase; - cara
menerapkan SQL migration; - konfigurasi Google Sheets; - konfigurasi
backend AI dan environment variables; - perintah lint, test, dan
build; - prosedur migrasi data lokal; - batasan versi awal dan
troubleshooting.

Sediakan `.env.example` berisi nama variabel dan placeholder, bukan
secret nyata.

## 8. Kebutuhan Nonfungsional

### Keamanan dan privasi

-   RLS diterapkan pada setiap tabel yang menyimpan data pengguna.
-   Validasi dijalankan di frontend dan backend.
-   Backend tidak mempercayai `user_id` yang dikirim client tanpa
    memverifikasi sesi.
-   Rahasia hanya disimpan dalam environment variables server atau
    secret manager.
-   Error yang ditampilkan ke pengguna tidak membocorkan stack trace
    atau token.
-   Sediakan backup dan cara ekspor data.
-   Jelaskan data apa yang dikirim ke penyedia AI.

### Kinerja

-   Query transaksi dibatasi berdasarkan periode bila memungkinkan.
-   Hindari mengambil seluruh riwayat untuk setiap render.
-   Tampilkan loading yang wajar dan hindari request berulang akibat
    render.
-   Jangan menambahkan caching kompleks sebelum ada kebutuhan yang
    terukur.

### Kegunaan

-   Pertahankan gaya visual dan navigasi FinTrack.
-   Semua fitur baru memiliki loading, success, empty, dan error state
    yang jelas.
-   Pesan UI menggunakan Bahasa Indonesia yang konsisten.
-   Layout tetap responsif untuk desktop dan perangkat mobile.

### Pemeliharaan

-   Pertahankan struktur sederhana dan konsisten dengan source code.
-   Gunakan dependensi baru hanya bila ada manfaat jelas.
-   Hindari duplikasi logika perhitungan keuangan.
-   Semua perubahan besar harus disertai test dan dokumentasi.

## 9. Prioritas Pengembangan

### P0 --- Fondasi dan keamanan

1.  Audit source code dan jalankan lint/test/build.
2.  Backup proyek dan data.
3.  Rancang skema Supabase serta RLS.
4.  Implementasikan repository/service.
5.  Implementasikan login dan operasi CRUD cloud.
6.  Buat migrasi data `localStorage` yang aman.
7.  Pastikan seluruh halaman lama tetap bekerja.

### P1 --- Google Sheets

1.  Tentukan pendekatan integrasi.
2.  Buat konfigurasi dan autentikasi.
3.  Implementasikan sinkronisasi satu arah.
4.  Tangani retry, duplikasi, status, dan error.
5.  Uji ekspor data dummy.

### P2 --- AI Financial Assistant

1.  Buat backend API ringan.
2.  Implementasikan autentikasi dan pembatasan request.
3.  Siapkan fungsi ringkasan keuangan deterministik.
4.  Integrasikan model AI melalui server.
5.  Buat UI chat.
6.  Uji akurasi angka, privasi, dan error.

### P3 --- Penyempurnaan

-   UX status sinkronisasi.
-   Perbaikan aksesibilitas dan mobile.
-   PWA atau fitur offline hanya jika benar-benar dibutuhkan.
-   MCP dapat dievaluasi setelah AI assistant dasar stabil.

## 10. Rencana Implementasi untuk AI Coding Assistant

AI harus bekerja secara bertahap dan tidak mencoba menyelesaikan semua
fitur dalam satu perubahan besar.

### Tahap A --- Audit sebelum coding

-   Baca struktur proyek, README, package.json, storage, perhitungan,
    validasi, halaman, dan test.
-   Jalankan test, lint, dan build yang tersedia.
-   Catat fungsi yang ada, risiko, dependensi, serta perubahan yang
    direncanakan.
-   Jangan mengubah kode sebelum audit singkat dilaporkan.

### Tahap B --- Fondasi cloud

-   Buat skema SQL dan RLS.
-   Tambahkan konfigurasi Supabase.
-   Buat repository/service.
-   Migrasikan halaman satu per satu.
-   Tambahkan autentikasi.
-   Buat migrasi data lokal.
-   Jalankan test setelah setiap bagian.

### Tahap C --- Google Sheets

-   Pilih pendekatan integrasi dan jelaskan trade-off.
-   Buat integrasi sinkronisasi satu arah.
-   Tambahkan status dan penanganan error.
-   Uji dengan spreadsheet dan data dummy.
-   Jangan menambahkan sinkronisasi dua arah.

### Tahap D --- AI assistant

-   Buat backend minimal.
-   Verifikasi autentikasi setiap request.
-   Buat fungsi ringkasan yang deterministik.
-   Integrasikan penyedia model melalui environment variable.
-   Tambahkan chat UI dan pengendalian biaya.
-   Uji dengan data dummy dan kasus batas.

### Tahap E --- Verifikasi akhir

-   Jalankan lint, test, dan build.
-   Periksa tidak ada secret yang masuk ke repository.
-   Uji RLS dengan dua akun berbeda.
-   Uji migrasi tanpa duplikasi.
-   Uji kegagalan jaringan dan integrasi.
-   Perbarui README dan `.env.example`.
-   Berikan ringkasan file yang berubah, cara menjalankan, hasil
    pengujian, konfigurasi manual yang masih diperlukan, dan
    keterbatasan yang belum diselesaikan.

## 11. Aturan Kerja AI Coding Assistant

1.  **Jangan membangun ulang dari nol.** Modifikasi source code FinTrack
    yang diberikan.
2.  Jangan menghapus atau mengganti fitur lama tanpa alasan dan
    persetujuan.
3.  Jangan mengubah desain dashboard secara besar-besaran.
4.  Jangan mengklaim fitur telah selesai jika belum dijalankan dan
    diuji.
5.  Jangan membuat kredensial, ID project, URL API, atau hasil pengujian
    palsu.
6.  Jika membutuhkan secret, buat `.env.example` dan minta pengguna
    mengisi nilai melalui environment lokal.
7.  Jangan pernah meminta pengguna mengirim API key rahasia ke
    percakapan.
8.  Jika membutuhkan tindakan manual dari pengguna, berhenti pada titik
    tersebut dan berikan langkah yang jelas.
9.  Setelah setiap tahap, laporkan perubahan, hasil test, risiko, dan
    langkah berikutnya.
10. Jika test gagal, perbaiki penyebabnya sebelum melanjutkan fitur yang
    bergantung pada bagian tersebut.
11. Jika ada ketidakjelasan pada source code, periksa kode terlebih
    dahulu dan jangan menebak.
12. Utamakan implementasi sederhana yang bisa dipahami dan dirawat oleh
    mahasiswa.

## 12. Definisi Selesai (Definition of Done)

Pembaruan dianggap selesai jika: - Fitur lama tetap berfungsi. -
Pengguna dapat login dan mengelola data cloud. - Data lokal dapat
dimigrasikan dengan aman. - Data hanya dapat diakses pemilik yang
berwenang. - Google Sheets menerima transaksi tanpa duplikasi pada
sinkronisasi ulang. - AI menjawab berdasarkan ringkasan data yang
dihitung aplikasi. - Secret tidak terekspos di frontend atau
repository. - Test, lint, dan build berhasil, atau kegagalan yang
tersisa dijelaskan dengan bukti. - README dan `.env.example` lengkap. -
Pengguna mendapat petunjuk jelas untuk semua konfigurasi manual.

## 13. Environment Variables

Buat `.env.example` sesuai kebutuhan implementasi. Nama variabel boleh
disesuaikan dengan framework, tetapi rahasia server tidak boleh
menggunakan prefix yang mengeksposnya ke frontend.

Contoh konseptual:

``` dotenv
# Frontend: nilai publik yang aman untuk browser
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Backend: jangan gunakan prefix VITE_ untuk rahasia
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
AI_PROVIDER_API_KEY=
AI_MODEL=

# Google OAuth / Sheets jika pendekatan OAuth backend dipilih
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

Catatan: jangan otomatis menambahkan semua variabel jika pendekatan yang
dipilih tidak membutuhkannya. Untuk operasi pengguna biasa, utamakan
sesi pengguna dan RLS. Service-role key hanya boleh digunakan di server
jika benar-benar diperlukan, karena dapat melewati RLS.

## 14. Output yang Harus Diberikan AI Setelah Setiap Tahap

Setelah menyelesaikan setiap tahap, AI harus melaporkan:

1.  Ringkasan implementasi.
2.  Daftar file yang dibuat atau diubah.
3.  Dependensi baru beserta alasan.
4.  Perintah yang dijalankan.
5.  Hasil test, lint, dan build yang benar-benar diperoleh.
6.  Langkah konfigurasi manual yang perlu dilakukan pengguna.
7.  Risiko, batasan, dan fitur yang belum selesai.
8.  Tahap berikutnya yang direkomendasikan.

Jangan menyatakan bahwa deployment, autentikasi Google, sinkronisasi
cloud, atau koneksi AI berhasil sebelum benar-benar diverifikasi.

------------------------------------------------------------------------

## Instruksi awal untuk AI coding assistant

Mulai dari **Tahap A --- Audit sebelum coding**. Periksa seluruh source
code proyek FinTrack yang diberikan. Jangan langsung mengimplementasikan
semua fitur. Laporkan kondisi aktual, hasil lint/test/build, rancangan
perubahan yang disesuaikan dengan kode nyata, serta langkah manual yang
akan diperlukan. Setelah audit selesai, lanjutkan ke P0 secara bertahap
tanpa menghilangkan fitur yang sudah ada.
