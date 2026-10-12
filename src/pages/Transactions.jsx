import { useMemo, useState } from "react";
import { FileSpreadsheet, Inbox, Plus, RotateCcw, Search, SearchX } from "lucide-react";
import EmptyState from "../components/EmptyState.jsx";
import Field from "../components/Field.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import TransactionTable from "../components/TransactionTable.jsx";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  TYPE_LABELS,
  categoriesFor,
} from "../utils/constants.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { transactionsToCsv, downloadTextFile } from "../utils/fileExport.js";
import { todayISO } from "../utils/dates.js";
import {
  EMPTY_FILTERS,
  filterTransactions,
  hasActiveFilters,
  sortNewestFirst,
  summarize,
} from "../utils/financeCalculations.js";

export default function Transactions({ transactions, onAdd, onEdit, onDelete, onNotify }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [pendingDelete, setPendingDelete] = useState(null);

  const visible = useMemo(() => sortNewestFirst(filterTransactions(transactions, filters)), [transactions, filters]);
  const totals = useMemo(() => summarize(visible), [visible]);
  const filtered = hasActiveFilters(filters);

  const categoryOptions = filters.type
    ? categoriesFor(filters.type)
    : [...new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES])];

  function setFilter(field, value) {
    setFilters((current) => {
      const next = { ...current, [field]: value };
      // Jika jenis berubah dan kategori terpilih tidak termasuk jenis itu, kategori dikosongkan.
      if (field === "type" && value && next.category && !categoriesFor(value).includes(next.category))
        next.category = "";
      return next;
    });
  }

  function exportCsv() {
    downloadTextFile(`fintrack-transaksi-${todayISO()}.csv`, transactionsToCsv(visible), "text/csv");
    onNotify("success", `${visible.length} transaksi diekspor ke CSV${filtered ? " sesuai filter aktif" : ""}.`);
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Belum ada transaksi"
        description="Mulai catat pemasukan dan pengeluaran Anda. Semua data tersimpan di browser ini."
      >
        <button type="button" onClick={() => onAdd()} className="btn btn-primary">
          <Plus size={18} strokeWidth={2} aria-hidden="true" />
          Tambah Transaksi
        </button>
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <section aria-label="Pencarian dan filter" className="card p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="sm:col-span-2 lg:col-span-2">
            <Field id="f-search" label="Cari">
              <div className="relative">
                <Search
                  size={18}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft"
                />
                <input
                  id="f-search"
                  type="search"
                  value={filters.search}
                  onChange={(e) => setFilter("search", e.target.value)}
                  placeholder="Keterangan, kategori, atau nominal"
                  className="input pl-10"
                />
              </div>
            </Field>
          </div>
          <Field id="f-from" label="Dari tanggal">
            <input
              id="f-from"
              type="date"
              value={filters.dateFrom}
              max={filters.dateTo || undefined}
              onChange={(e) => setFilter("dateFrom", e.target.value)}
              className="input"
            />
          </Field>
          <Field id="f-to" label="Sampai tanggal">
            <input
              id="f-to"
              type="date"
              value={filters.dateTo}
              min={filters.dateFrom || undefined}
              onChange={(e) => setFilter("dateTo", e.target.value)}
              className="input"
            />
          </Field>
          <Field id="f-type" label="Jenis">
            <select
              id="f-type"
              value={filters.type}
              onChange={(e) => setFilter("type", e.target.value)}
              className="input"
            >
              <option value="">Semua jenis</option>
              <option value="income">{TYPE_LABELS.income}</option>
              <option value="expense">{TYPE_LABELS.expense}</option>
            </select>
          </Field>
          <Field id="f-category" label="Kategori">
            <select
              id="f-category"
              value={filters.category}
              onChange={(e) => setFilter("category", e.target.value)}
              className="input"
            >
              <option value="">Semua kategori</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field id="f-method" label="Metode pembayaran">
            <select
              id="f-method"
              value={filters.paymentMethod}
              onChange={(e) => setFilter("paymentMethod", e.target.value)}
              className="input"
            >
              <option value="">Semua metode</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-soft" aria-live="polite">
            Menampilkan <span className="font-medium text-ink">{visible.length}</span> dari {transactions.length}{" "}
            transaksi
            {visible.length > 0 ? (
              <>
                . Masuk <span className="font-medium text-income tabular-nums">{formatCurrency(totals.income)}</span>,
                keluar <span className="font-medium text-expense tabular-nums">{formatCurrency(totals.expense)}</span>
              </>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              disabled={!filtered}
              className="btn btn-secondary"
            >
              <RotateCcw size={18} strokeWidth={1.75} aria-hidden="true" />
              Reset filter
            </button>
            <button type="button" onClick={exportCsv} disabled={visible.length === 0} className="btn btn-secondary">
              <FileSpreadsheet size={18} strokeWidth={1.75} aria-hidden="true" />
              Ekspor CSV
            </button>
          </div>
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="sr-only">Daftar transaksi</h2>
        {visible.length > 0 ? (
          <TransactionTable transactions={visible} onEdit={onEdit} onDelete={setPendingDelete} />
        ) : (
          <EmptyState
            icon={SearchX}
            title="Tidak ada transaksi yang cocok"
            description="Coba ubah kata kunci atau longgarkan filter yang aktif."
          >
            <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="btn btn-secondary">
              Reset filter
            </button>
          </EmptyState>
        )}
      </section>

      {pendingDelete ? (
        <ConfirmDialog
          danger
          title="Hapus transaksi ini?"
          message={`${pendingDelete.description || pendingDelete.category} sebesar ${formatCurrency(pendingDelete.amount)} akan dihapus dan tidak bisa dikembalikan.`}
          confirmLabel="Hapus"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            onDelete(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      ) : null}
    </div>
  );
}
