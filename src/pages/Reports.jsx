import { useMemo, useState } from "react";
import { FileSpreadsheet, Inbox, PiggyBank, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { BalanceTrendChart } from "../components/Charts.jsx";
import CategoryBreakdown from "../components/CategoryBreakdown.jsx";
import EmptyState from "../components/EmptyState.jsx";
import MonthPicker from "../components/MonthPicker.jsx";
import SummaryCard from "../components/SummaryCard.jsx";
import { addMonths, currentMonthKey, formatMonthLabel, lastNMonths, monthKeyOf } from "../utils/dates.js";
import { downloadTextFile, transactionsToCsv } from "../utils/fileExport.js";
import { balanceByMonth, expenseByCategory, filterByMonth, summarize } from "../utils/financeCalculations.js";
import { formatCurrency, formatPercent } from "../utils/formatCurrency.js";

export default function Reports({ transactions, onNotify }) {
  const [month, setMonth] = useState(currentMonthKey());

  const monthTransactions = useMemo(() => filterByMonth(transactions, month), [transactions, month]);
  const summary = useMemo(() => summarize(monthTransactions), [monthTransactions]);
  const categories = useMemo(() => expenseByCategory(monthTransactions), [monthTransactions]);
  const trend = useMemo(() => balanceByMonth(transactions, lastNMonths(month, 12)), [transactions, month]);
  const dataYears = useMemo(
    () => [...new Set(transactions.map((t) => Number(monthKeyOf(t.date).slice(0, 4))))],
    [transactions],
  );
  const biggest = categories[0];

  function exportMonth() {
    downloadTextFile(`fintrack-laporan-${month}.csv`, transactionsToCsv(monthTransactions), "text/csv");
    onNotify("success", `${monthTransactions.length} transaksi ${formatMonthLabel(month)} diekspor ke CSV.`);
  }

  // Bulan sebelumnya sebagai pembanding singkat untuk pengeluaran.
  const previousExpense = useMemo(
    () => summarize(filterByMonth(transactions, addMonths(month, -1))).expense,
    [transactions, month],
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
        <SummaryCard
          tone="hero"
          icon={Wallet}
          label="Saldo bersih"
          value={formatCurrency(summary.balance)}
          hint={`Selisih bulan ${formatMonthLabel(month)}`}
          className="col-span-2 lg:col-span-1"
        />
        <SummaryCard tone="income" icon={TrendingUp} label="Pemasukan" value={formatCurrency(summary.income)} />
        <SummaryCard tone="expense" icon={TrendingDown} label="Pengeluaran" value={formatCurrency(summary.expense)} />
        <SummaryCard
          tone="neutral"
          icon={PiggyBank}
          label="Saving rate"
          value={formatPercent(summary.savingRate, 1)}
          hint={summary.savingRate === null ? "Belum ada pemasukan" : undefined}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {monthTransactions.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={`Tidak ada transaksi di ${formatMonthLabel(month)}`}
          description="Pilih bulan lain untuk melihat laporannya. Tren saldo di bawah tetap menampilkan 12 bulan terakhir."
        />
      ) : (
        <section className="card p-5">
          <h2 className="text-base font-semibold tracking-tight">Kategori pengeluaran terbesar</h2>
          {biggest ? (
            <>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                <span className="font-medium text-ink">{biggest.category}</span> memakai{" "}
                {formatPercent(biggest.percent, 0)} dari pengeluaran bulan ini ({formatCurrency(biggest.amount)}).
                {previousExpense > 0 ? (
                  <>
                    {" "}
                    Total pengeluaran {summary.expense >= previousExpense ? "naik" : "turun"}{" "}
                    {formatPercent((Math.abs(summary.expense - previousExpense) / previousExpense) * 100, 0)} dibanding
                    bulan sebelumnya.
                  </>
                ) : null}
              </p>
              <div className="mt-5">
                <CategoryBreakdown data={categories} total={summary.expense} />
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">Belum ada pengeluaran pada bulan ini.</p>
          )}
        </section>
      )}

      <section className="card p-5">
        <h2 className="text-base font-semibold tracking-tight">Tren saldo</h2>
        <p className="mt-0.5 text-xs text-ink-soft">
          12 bulan hingga {formatMonthLabel(month)}, saldo kumulatif dari seluruh transaksi
        </p>
        <div className="mt-4">
          <BalanceTrendChart data={trend} />
        </div>
      </section>
    </div>
  );
}
