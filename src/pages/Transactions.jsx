import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Inbox,
  Plus,
  Repeat,
  RotateCcw,
  Search,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";
import EmptyState from "../components/EmptyState.jsx";
import Field from "../components/Field.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import TransactionTable from "../components/TransactionTable.jsx";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  categoriesFor,
} from "../utils/constants.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { downloadTextFile, transactionsToCsv } from "../utils/fileExport.js";
import { todayISO } from "../utils/dates.js";
import {
  EMPTY_FILTERS,
  filterTransactions,
  hasActiveFilters,
  sortNewestFirst,
  summarize,
} from "../utils/financeCalculations.js";

const PAGE_SIZE = 25;

export default function Transactions({
  transactions,
  user = null,
  initialFilterPreset = null,
  pendingRecurringCount = 0,
  onOpenRecurring,
  onAdd,
  onEdit,
  onDelete,
  onNotify,
}) {
  const [filters, setFilters] = useState(() =>
    initialFilterPreset?.filters ? { ...EMPTY_FILTERS, ...initialFilterPreset.filters } : EMPTY_FILTERS,
  );
  const [appliedNonce, setAppliedNonce] = useState(() => initialFilterPreset?.nonce ?? 0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);
  const searchRef = useRef(null);

  if (initialFilterPreset && initialFilterPreset.nonce !== appliedNonce) {
    setAppliedNonce(initialFilterPreset.nonce);
    setFilters({ ...EMPTY_FILTERS, ...initialFilterPreset.filters });
    setCurrentPage(1);
  }

  const visible = useMemo(() => sortNewestFirst(filterTransactions(transactions, filters)), [transactions, filters]);
  const totals = useMemo(() => summarize(visible), [visible]);
  const filtered = hasActiveFilters(filters);

  const activeAdvancedCount = [
    filters.dateFrom,
    filters.dateTo,
    filters.category,
    filters.paymentMethod,
  ].filter(Boolean).length;

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageItems = useMemo(() => visible.slice(pageStart, pageStart + PAGE_SIZE), [visible, pageStart]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || event.target?.isContentEditable) return;
      if (document.querySelector("dialog[open]")) return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const categoryOptions = filters.type
    ? categoriesFor(filters.type)
    : [...new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES])];

  function setFilter(field, value) {
    setCurrentPage(1);
    setFilters((current) => {
      const next = { ...current, [field]: value };
      if (field === "type" && value && next.category && !categoriesFor(value).includes(next.category)) {
        next.category = "";
      }
      return next;
    });
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
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
        description={
          user
            ? "Mulai catat pemasukan dan pengeluaran Anda. Semua catatan tersimpan otomatis di akun cloud Anda."
            : "Mulai catat pemasukan dan pengeluaran Anda. Semua catatan tersimpan di browser ini."
        }
      >
        <button type="button" onClick={() => onAdd()} className="btn btn-primary">
          <Plus size={18} strokeWidth={2} aria-hidden="true" />
          Tambah Transaksi
        </button>
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Pencarian dan filter" className="card p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="min-w-0 flex-1">
            <Field id="f-search" label="Cari transaksi">
              <div className="relative">
                <Search
                  size={17}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-soft"
                />
                <input
                  id="f-search"
                  ref={searchRef}
                  type="search"
                  value={filters.search}
                  onChange={(e) => setFilter("search", e.target.value)}
                  placeholder="Keterangan, kategori, atau nominal"
                  title="Cari transaksi (pintasan keyboard: /)"
                  className="input pl-10"
                />
              </div>
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Filter jenis transaksi"
              className="inline-flex rounded-xl border border-line bg-surface-2 p-1"
            >
              {[
                { value: "", label: "Semua" },
                { value: "income", label: "Masuk" },
                { value: "expense", label: "Keluar" },
              ].map((opt) => {
                const active = filters.type === opt.value;
                return (
                  <button
                    key={opt.value || "all"}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilter("type", opt.value)}
                    className={`min-h-9 rounded-lg px-3 text-xs font-medium transition-colors ${
                      active ? "bg-surface text-ink shadow-xs" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setMobileFiltersOpen((open) => !open)}
              aria-expanded={mobileFiltersOpen}
              aria-controls="advanced-filters"
              className="btn btn-secondary md:hidden"
            >
              <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
              Filter{activeAdvancedCount > 0 ? ` (${activeAdvancedCount})` : ""}
            </button>
            <button type="button" onClick={resetFilters} disabled={!filtered} className="btn btn-secondary">
              <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />
              Reset
            </button>
            {onOpenRecurring ? (
              <button type="button" onClick={onOpenRecurring} className="btn btn-secondary">
                <Repeat size={16} strokeWidth={1.75} aria-hidden="true" />
                Rutin
                {pendingRecurringCount > 0 ? (
                  <span className="rounded-full bg-surface-3 px-1.5 py-0.5 text-[11px] font-semibold text-ink tabular-nums">
                    {pendingRecurringCount}
                  </span>
                ) : null}
              </button>
            ) : null}
            <button type="button" onClick={exportCsv} disabled={visible.length === 0} className="btn btn-secondary">
              <FileSpreadsheet size={16} strokeWidth={1.75} aria-hidden="true" />
              Ekspor CSV
            </button>
          </div>
        </div>

        {/* 4 filter lanjutan dalam 4 kolom seimbang di layar lebar */}
        <div
          id="advanced-filters"
          className={`${mobileFiltersOpen ? "mt-4 grid" : "hidden"} gap-3 border-t border-line pt-4 sm:grid-cols-2 md:mt-4 md:grid lg:grid-cols-4`}
        >
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

        {/* Ringkasan angka hasil filter */}
        <div
          aria-live="polite"
          className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-3.5 text-xs text-ink-soft"
        >
          <span>
            Menampilkan <strong className="font-semibold text-ink tabular-nums">{visible.length}</strong> dari{" "}
            {transactions.length} transaksi
          </span>
          {visible.length > 0 ? (
            <>
              <span>
                Masuk{" "}
                <strong className="money-mask font-semibold text-income tabular-nums">
                  {formatCurrency(totals.income)}
                </strong>
              </span>
              <span>
                Keluar{" "}
                <strong className="money-mask font-semibold text-expense tabular-nums">
                  {formatCurrency(totals.expense)}
                </strong>
              </span>
              <span>
                Selisih{" "}
                <strong className="money-mask font-semibold text-ink tabular-nums">
                  {formatCurrency(totals.balance)}
                </strong>
              </span>
            </>
          ) : null}
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="sr-only">Daftar transaksi</h2>
        {visible.length > 0 ? (
          <>
            <TransactionTable transactions={pageItems} onEdit={onEdit} onDelete={setPendingDelete} />

            {totalPages > 1 ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-ink-soft">
                <span className="tabular-nums">
                  Halaman {safePage} dari {totalPages} ({pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, visible.length)}{" "}
                  dari {visible.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="btn btn-secondary text-xs"
                  >
                    <ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="btn btn-secondary text-xs"
                  >
                    Berikutnya
                    <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={SearchX}
            headingAs="h3"
            boxed={false}
            title="Tidak ada transaksi yang cocok"
            description="Coba ubah kata kunci atau longgarkan filter yang aktif."
          >
            <button type="button" onClick={resetFilters} className="btn btn-secondary">
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
