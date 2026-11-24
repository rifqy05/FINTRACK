/**
 * ==============================================================================
 * FinTrack: Google Apps Script Web App Integration
 * ==============================================================================
 * Petunjuk Pemasangan:
 * 1. Buat Google Spreadsheet baru di Google Drive Anda.
 * 2. Buka menu Extensions > Apps Script.
 * 3. Hapus kode default, lalu tempelkan seluruh kode ini.
 * 4. WAJIB ubah CONFIG_SECRET_TOKEN di bawah menjadi token rahasia pilihan Anda.
 * 5. Klik tombol "Deploy" (kanan atas) > "New deployment".
 * 6. Pilih jenis: "Web app".
 *    - Description: "FinTrack Sync"
 *    - Execute as: "Me" (email Google Anda)
 *    - Who has access: "Anyone" (agar FinTrack dari browser Anda bisa mengirim data)
 * 7. Klik "Deploy", beri izin akses jika diminta, lalu salin "Web app URL".
 * 8. Tempelkan URL tersebut dan Secret Token Anda ke aplikasi FinTrack di Pengaturan.
 * ==============================================================================
 */

// WAJIB ganti nilai ini dengan token rahasia pilihan Anda (samakan dengan token di FinTrack)
var CONFIG_SECRET_TOKEN = "fintrack-secret-token-change-me";
var TARGET_SHEET_NAME = "FinTrack";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ ok: false, error: "Permintaan tidak memiliki payload data." });
    }

    var request = JSON.parse(e.postData.contents);

    // 1. Verifikasi Secret Token (fail-closed: tolak jika token belum diganti atau tidak cocok)
    if (!CONFIG_SECRET_TOKEN || CONFIG_SECRET_TOKEN === "fintrack-secret-token-change-me") {
      return createJsonResponse({
        ok: false,
        error: "Token rahasia di Apps Script belum diganti. Ubah CONFIG_SECRET_TOKEN di Code.gs lalu deploy ulang.",
      });
    }
    if (request.secretToken !== CONFIG_SECRET_TOKEN) {
      return createJsonResponse({ ok: false, error: "Akses ditolak: Secret token tidak cocok." });
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
      var transactions = Array.isArray(request.transactions) ? request.transactions : [];
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
 * Netralkan sel teks yang diawali karakter rumus (= + - @ tab/CR) agar aman dari formula injection.
 */
function sanitizeCellText(value) {
  var text = String(value === null || value === undefined ? "" : value);
  if (/^[=+\-@\t\r]/.test(text)) {
    return "'" + text;
  }
  return text;
}

/**
 * Ambil sheet khusus "FinTrack" agar sinkronisasi tidak menimpa tab lain secara tidak sengaja.
 */
function getOrCreateTargetSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var named = ss.getSheetByName(TARGET_SHEET_NAME);
  if (named) return named;

  var active = ss.getActiveSheet();
  if (active.getLastRow() === 0 || String(active.getRange(1, 1).getValue()).trim() === "Transaction ID") {
    active.setName(TARGET_SHEET_NAME);
    return active;
  }

  return ss.insertSheet(TARGET_SHEET_NAME);
}

/**
 * Memproses data transaksi ke spreadsheet secara idempoten (tanpa duplikasi) dengan batch write.
 */
function processTransactionsSync(transactions) {
  var sheet = getOrCreateTargetSheet();
  var headers = [
    "Transaction ID",
    "Date",
    "Type",
    "Category",
    "Description",
    "Amount (IDR)",
    "Payment Method",
    "Last Updated",
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
  var existingRows = [];
  var existingIndexById = {};

  // Baca seluruh baris yang sudah ada dalam 1 kali panggilan API
  if (lastRow > 1) {
    existingRows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    for (var i = 0; i < existingRows.length; i++) {
      var id = String(existingRows[i][0]).trim();
      if (id) {
        existingIndexById[id] = i;
      }
    }
  }

  var updatedCount = 0;
  var insertedCount = 0;
  var existingDirty = false;
  var nowISO = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd HH:mm:ss");
  var rowsToAppend = [];

  for (var j = 0; j < transactions.length; j++) {
    var t = transactions[j];
    var txId = String(t.id || "").trim();
    if (!txId) continue;

    var rowData = [
      sanitizeCellText(txId),
      sanitizeCellText(t.date || ""),
      t.type === "income" ? "Pemasukan" : "Pengeluaran",
      sanitizeCellText(t.category || ""),
      sanitizeCellText(t.description || ""),
      Number(t.amount) || 0,
      sanitizeCellText(t.paymentMethod || "Tunai"),
      nowISO,
    ];

    if (Object.prototype.hasOwnProperty.call(existingIndexById, txId)) {
      existingRows[existingIndexById[txId]] = rowData;
      existingDirty = true;
      updatedCount++;
    } else {
      existingIndexById[txId] = existingRows.length + rowsToAppend.length;
      rowsToAppend.push(rowData);
      insertedCount++;
    }
  }

  // Tulis pembaruan baris lama sekaligus (1 batch call, menghindari N+1 API call di loop)
  if (existingDirty && existingRows.length > 0) {
    sheet.getRange(2, 1, existingRows.length, headers.length).setValues(existingRows);
  }

  // Tulis batch baris baru jika ada
  if (rowsToAppend.length > 0) {
    var startAppendRow = existingRows.length + 2;
    sheet.getRange(startAppendRow, 1, rowsToAppend.length, headers.length).setValues(rowsToAppend);
  }

  // Format kolom jumlah sebagai angka
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 6, sheet.getLastRow() - 1, 1).setNumberFormat("#,##0");
  }

  return {
    totalReceived: transactions.length,
    updated: updatedCount,
    inserted: insertedCount,
    syncedAt: nowISO,
  };
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
