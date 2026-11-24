import { useMemo, useState } from "react";
import { ArrowRight, FileSpreadsheet, FlaskConical, Inbox, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { BalanceTrendChart } from "../components/Charts.jsx";
import CategoryBreakdown from "../components/CategoryBreakdown.jsx";
import EmptyState from "../components/EmptyState.jsx";
import MonthPicker from "../components/MonthPicker.jsx";
import { addMonths, currentMonthKey, daysInMonth, formatMonthLabel, lastNMonths, monthKeyOf } from "../utils/dates.js";
import { downloadTextFile, transactionsToCsv } from "../utils/fileExport.js";
import {
  balanceByMonth,
  expenseByCategory,
  filterByMonth,
  summarize,
  summarizeByPaymentMethod,
} from "../utils/financeCalculations.js";
import { formatCurrency, formatPercent } from "../utils/formatCurrency.js";

export default function Reports({ transactions, onNotify, onAdd, onLoadDemo, onDrillDown }) {
  const [month, setMonth] = useState(currentMonthKey());

  const monthTransactions = useMemo(() => filterByMonth(transactions, month), [transactions, month]);
  const summary = useMemo(() => summarize(monthTransactions), [monthTransactions]);
  const categories = useMemo(() => expenseByCategory(monthTransactions), [monthTransactions]);
  const paymentMethods = useMemo(() => summarizeByPaymentMethod(monthTransactions), [monthTransactions]);
  const trend = useMemo(() => balanceByMonth(transactions, lastNMonths(month, 12)), [transactions, month]);
  const dataYears = useMemo(
    () => [...new Set(transactions.map((t) => Number(monthKeyOf(t.date).slice(0, 4))))],
    [transactions],
  );
  const biggest = categories[0];

  const monthBounds = useMemo(() => {
    const last = String(daysInMonth(month)).padStart(2, "0");
    return { dateFrom: `${month}-01`, dateTo: `${month}-${last}` };
  }, [month]);

  function exportMonth() {
    downloadTextFile(`fintrack-laporan-${month}.csv`, transactionsToCsv(monthTransactions), "text/csv");
    onNotify("success", `${monthTransactions.length} transaksi ${formatMonthLabel(month)} diekspor ke CSV.`);
  }

  const previousExpense = useMemo(
    () => summarize(filterByMonth(transactions, addMonths(month, -1))).expense,
    [transactions, month],
  );

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Belum ada data laporan"
        description="Catat transaksi pertama Anda untuk melihat ringkasan bulanan, porsi kategori, dan tren saldo 12 bulan terakhir."
      >
        {onAdd ? (
          <button type="button" onClick={() => onAdd()} className="btn btn-primary">
            <Plus size={18} strokeWidth={2} aria-hidden="true" />
            Tambah Transaksi
          </button>
        ) : null}
        {onLoadDemo ? (
          <button type="button" onClick={onLoadDemo} className="btn btn-secondary">
            <FlaskConical size={18} strokeWidth={1.75} aria-hidden="true" />
            Muat data contoh
          </button>
        ) : null}
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="card flex flex-wrap items-end justify-between gap-4 p-5">
        <MonthPicker idPrefix="report" value={month} onChange={setMonth} extraYears={dataYears} />
        <button
          type="button"
          onClick={exportMonth}
          disabled={monthTransactions.length === 0}
          className="btn btn-secondary"
        >
          <FileSpreadsheet size={18} strokeWidth={1.75} aria-hidden="true" />
          Ekspor CSV bulan ini
        </button>
      </section>

      {/* Dek ringkasan bulanan terpadu */}
      <section className="hero-deck p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-hero-line">
          <div className="lg:pr-6">
            <p className="text-xs text-hero-soft">Saldo bersih · {formatMonthLabel(month)}</p>
            <p className="money-mask mt-1.5 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
              {formatCurrency(summary.balance)}
            </p>
            <p className="mt-1 text-xs text-hero-soft">{monthTransactions.length} transaksi tercatat</p>
          </div>

          <div className="lg:px-6">
            <p className="flex items-center gap-1.5 text-xs text-hero-soft">
              <span className="size-2 rounded-full bg-income" aria-hidden="true" />
              Pemasukan
            </p>
            <p className="money-mask mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
              {formatCurrency(summary.income)}
            </p>
          </div>

          <div className="lg:px-6">
            <p className="flex items-center gap-1.5 text-xs text-hero-soft">
              <span className="size-2 rounded-full bg-expense" aria-hidden="true" />
              Pengeluaran
            </p>
            <p className="money-mask mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
              {formatCurrency(summary.expense)}
            </p>
            {previousExpense > 0 ? (
              <p className="mt-1 flex items-center gap-1 text-xs text-hero-soft tabular-nums">
                {summary.expense >= previousExpense ? (
                  <TrendingUp size={13} className="shrink-0 text-expense" aria-hidden="true" />
                ) : (
                  <TrendingDown size={13} className="shrink-0 text-income" aria-hidden="true" />
                )}
                <span>
                  {summary.expense >= previousExpense ? "Naik" : "Turun"}{" "}
                  {formatPercent((Math.abs(summary.expense - previousExpense) / previousExpense) * 100, 0)} vs bulan lalu
                </span>
              </p>
            ) : null}
          </div>

          <div className="lg:pl-6">
            <p className="flex items-center gap-1.5 text-xs text-hero-soft">
              <span className="size-2 rounded-full bg-income" aria-hidden="true" />
              Rasio tabungan
            </p>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
              {formatPercent(summary.savingRate, 1)}
            </p>
            <p className="mt-1 text-xs text-hero-soft">
              {summary.savingRate === null ? "Belum ada pemasukan" : "Bagian pemasukan yang tersisa"}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-12">
        <section className="card flex min-w-0 flex-col p-5 xl:col-span-7">
          <h2 className="text-base font-semibold tracking-tight">Tren saldo 12 bulan</h2>
          <p className="mt-0.5 text-xs text-ink-soft text-pretty">
            Hingga {formatMonthLabel(month)}, saldo kumulatif dari seluruh transaksi
          </p>
          <div className="mt-4 flex flex-1 flex-col">
            <BalanceTrendChart data={trend} />
          </div>
        </section>

        <section className="card min-w-0 p-5 xl:col-span-5">
          <h2 className="text-base font-semibold tracking-tight">Pengeluaran terbesar</h2>
          {monthTransactions.length === 0 ? (
            <EmptyState
              icon={Inbox}
              headingAs="h3"
              boxed={false}
              title={`Tidak ada transaksi di ${formatMonthLabel(month)}`}
              description="Pilih bulan lain untuk melihat rincian kategori."
            />
          ) : biggest ? (
            <>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft text-pretty">
                <span className="font-medium text-ink">{biggest.category}</span> mengambil{" "}
                {formatPercent(biggest.percent, 0)} pengeluaran bulan ini (
                <span className="money-mask">{formatCurrency(biggest.amount)}</span>).
              </p>
              <div className="mt-5">
                <CategoryBreakdown
                  data={categories}
                  total={summary.expense}
                  onSelectCategory={
                    onDrillDown
                      ? (cat) => onDrillDown({ type: "expense", category: cat, ...monthBounds })
                      : undefined
                  }
                />
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">Belum ada pengeluaran pada bulan ini.</p>
          )}
        </section>
      </div>

      {/* Ringkasan arus kas per metode pembayaran / dompet */}
      {paymentMethods.length > 0 ? (
        <section className="card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Arus per metode pembayaran</h2>
              <p className="mt-0.5 text-xs text-ink-soft">
                {formatMonthLabel(month)} · klik metode untuk meninjau transaksinya
              </p>
            </div>
            <span className="text-xs text-ink-soft tabular-nums">{paymentMethods.length} kanal aktif</span>
          </div>

          <ul className="mt-4 divide-y divide-line">
            {paymentMethods.map((row) => (
              <li key={row.method}>
                <button
                  type="button"
                  onClick={() => onDrillDown?.({ paymentMethod: row.method, ...monthBounds })}
                  disabled={!onDrillDown}
                  className="grid w-full grid-cols-1 gap-2 rounded-xl px-2 py-3 text-left transition-colors hover:bg-surface-2/70 sm:grid-cols-12 sm:items-center sm:gap-4"
                >
                  <div className="flex items-center justify-between gap-2 sm:col-span-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{row.method}</p>
                      <p className="text-xs text-ink-soft tabular-nums">
                        {row.count} transaksi · {formatPercent(row.sharePercent, 0)} volume
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs tabular-nums sm:col-span-5">
                    <span className="text-ink-soft">
                      Masuk{" "}
                      <strong className="money-mask font-medium text-income">{formatCurrency(row.income)}</strong>
                    </span>
                    <span className="text-ink-soft">
                      Keluar{" "}
                      <strong className="money-mask font-medium text-expense">{formatCurrency(row.expense)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 sm:col-span-3 sm:justify-end">
                    <span
                      className={`money-mask text-sm font-semibold tabular-nums ${
                        row.net > 0 ? "text-income" : row.net < 0 ? "text-expense" : "text-ink"
                      }`}
                    >
                      {row.net > 0 ? "+" : row.net < 0 ? "-" : ""}
                      {formatCurrency(Math.abs(row.net))}
                    </span>
                    {onDrillDown ? (
                      <ArrowRight size={14} className="shrink-0 text-ink-soft" aria-hidden="true" />
                    ) : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
