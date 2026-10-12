/**
 * ==============================================================================
 * FinTrack: Google Apps Script Web App Integration
 * ==============================================================================
 * Petunjuk Pemasangan:
 * 1. Buat Google Spreadsheet baru di Google Drive Anda.
 * 2. Buka menu Extensions > Apps Script.
 * 3. Hapus kode default, lalu tempelkan seluruh kode ini.
 * 4. Atur SECRET_TOKEN di bawah (buat kata sandi/token rahasia bebas).
 * 5. Klik tombol "Deploy" (kanan atas) > "New deployment".
 * 6. Pilih jenis: "Web app".
 *    - Description: "FinTrack Sync"
 *    - Execute as: "Me" (email Google Anda)
 *    - Who has access: "Anyone" (agar FinTrack dari browser Anda bisa mengirim data)
 * 7. Klik "Deploy", beri izin akses jika diminta, lalu salin "Web app URL".
 * 8. Tempelkan URL tersebut dan Secret Token Anda ke aplikasi FinTrack di Pengaturan.
 * ==============================================================================
 */

// Ganti nilai ini dengan token rahasia pilihan Anda (atau samakan dengan token di FinTrack)
var CONFIG_SECRET_TOKEN = "fintrack-secret-token-change-me";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ ok: false, error: "Permintaan tidak memiliki payload data." });
    }

    var request = JSON.parse(e.postData.contents);

    // 1. Verifikasi Secret Token
    if (CONFIG_SECRET_TOKEN && CONFIG_SECRET_TOKEN !== "fintrack-secret-token-change-me") {
      if (request.secretToken !== CONFIG_SECRET_TOKEN) {
        return createJsonResponse({ ok: false, error: "Akses ditolak: Secret token tidak cocok." });
      }
    }

    // 2. Aksi Uji Koneksi (Ping)
    if (request.action === "ping") {
      return createJsonResponse({
        ok: true,
        message: "Koneksi ke Google Sheets berhasil terhubung!",
        spreadsheetTitle: SpreadsheetApp.getActiveSpreadsheet().getName(),
      });
    }

    // 3. Aksi Sinkronisasi Transaksi
    if (request.action === "sync_transactions") {
      var transactions = request.transactions || [];
      var result = processTransactionsSync(transactions);
      return createJsonResponse({
        ok: true,
        message: "Sinkronisasi berhasil.",
        stats: result,
      });
    }

    return createJsonResponse({ ok: false, error: "Aksi tidak dikenali: " + request.action });
  } catch (err) {
    return createJsonResponse({ ok: false, error: "Terjadi kesalahan pada script: " + err.toString() });
  }
}

function doGet() {
  return createJsonResponse({
    ok: true,
    message: "FinTrack Google Apps Script Web App aktif dan siap menerima data.",
  });
}

/**
 * Memproses data transaksi ke spreadsheet secara idempoten (tanpa duplikasi).
 */
function processTransactionsSync(transactions) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var headers = [
    "Transaction ID",
    "Date",
    "Type",
    "Category",
    "Description",
    "Amount (IDR)",
    "Payment Method",
    "Last Updated"
  ];

  // Inisialisasi header jika sheet masih kosong
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#F1F5F9");
    sheet.setFrozenRows(1);
  }

  var lastRow = sheet.getLastRow();
  var existingIds = {};

  // Baca seluruh ID transaksi yang sudah ada di kolom 1
  if (lastRow > 1) {
    var idRange = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < idRange.length; i++) {
      var id = String(idRange[i][0]).trim();
      if (id) {
        existingIds[id] = i + 2; // Catat nomor baris aktual di sheet (1-indexed)
      }
    }
  }

  var updatedCount = 0;
  var insertedCount = 0;
  var nowISO = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");

  var rowsToAppend = [];

  for (var j = 0; j < transactions.length; j++) {
    var t = transactions[j];
    var txId = String(t.id).trim();
    var rowData = [
      txId,
      t.date || "",
      t.type === "income" ? "Pemasukan" : "Pengeluaran",
      t.category || "",
      t.description || "",
      Number(t.amount) || 0,
      t.paymentMethod || "Tunai",
      nowISO
    ];

    if (existingIds[txId]) {
      // Perbarui baris yang sudah ada (Idempotent Update)
      var targetRow = existingIds[txId];
      sheet.getRange(targetRow, 1, 1, headers.length).setValues([rowData]);
      updatedCount++;
    } else {
      // Tambahkan ke daftar antrean append
      rowsToAppend.push(rowData);
      insertedCount++;
    }
  }

  // Tulis batch baris baru jika ada
  if (rowsToAppend.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);
  }

  // Format kolom jumlah sebagai angka
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 6, sheet.getLastRow() - 1, 1).setNumberFormat("#,##0");
  }

  return {
    totalReceived: transactions.length,
    updated: updatedCount,
    inserted: insertedCount,
    syncedAt: nowISO
  };
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
