import { useMemo } from "react";
import { FlaskConical, Inbox, PiggyBank, Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import SummaryCard from "../components/SummaryCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import CategoryBreakdown from "../components/CategoryBreakdown.jsx";
import TransactionTable from "../components/TransactionTable.jsx";
import BudgetProgress from "../components/BudgetProgress.jsx";
import { BalanceTrendChart, IncomeExpenseChart } from "../components/Charts.jsx";
import { currentMonthKey, formatMonthLabel } from "../utils/dates.js";
import { formatCurrency, formatPercent } from "../utils/formatCurrency.js";
import {
  budgetUsageForMonth,
  buildBalanceTrend,
  buildIncomeExpenseSeries,
  expenseByCategory,
  filterByPeriod,
  sortNewestFirst,
  summarize,
} from "../utils/financeCalculations.js";

function Panel({ title, description, children, className = "" }) {
  return (
    <section className={`card min-w-0 p-5 ${className}`}>
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {description ? <p className="mt-0.5 text-xs text-ink-soft">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function Dashboard({ transactions, budgets, period, onNavigate, onAdd, onLoadDemo }) {
  const todayMonth = currentMonthKey();
  const isMonth = period.type === "month";
  const budgetMonth = isMonth ? period.month : todayMonth;

  // Satu daftar transaksi per periode dipakai oleh kartu, grafik, dan daftar terbaru.
  const periodTransactions = useMemo(() => filterByPeriod(transactions, period), [transactions, period]);
  const summary = useMemo(() => summarize(periodTransactions), [periodTransactions]);
  const series = useMemo(() => buildIncomeExpenseSeries(transactions, period), [transactions, period]);
  const categories = useMemo(() => expenseByCategory(periodTransactions), [periodTransactions]);
  const trend = useMemo(() => buildBalanceTrend(transactions, period, todayMonth), [transactions, period, todayMonth]);
  const recent = useMemo(() => sortNewestFirst(periodTransactions).slice(0, 5), [periodTransactions]);
  const budgetRows = useMemo(
    () => budgetUsageForMonth(budgets, transactions, budgetMonth),
    [budgets, transactions, budgetMonth],
  );

  const periodLabel = isMonth ? formatMonthLabel(period.month) : "Semua data";

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Belum ada transaksi"
        description="Catat pemasukan atau pengeluaran pertama Anda, atau muat data contoh untuk melihat seperti apa dashboard ini bekerja."
      >
        <button type="button" onClick={() => onAdd()} className="btn btn-primary">
          <Plus size={18} strokeWidth={2} aria-hidden="true" />
          Tambah Transaksi
        </button>
        <button type="button" onClick={onLoadDemo} className="btn btn-secondary">
          <FlaskConical size={18} strokeWidth={1.75} aria-hidden="true" />
          Muat data contoh
        </button>
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
        <SummaryCard
          tone="hero"
          icon={Wallet}
          label="Saldo bersih"
          value={formatCurrency(summary.balance)}
          hint={`Pemasukan dikurangi pengeluaran, ${periodLabel.toLowerCase()}`}
          className="col-span-2 lg:col-span-1"
        />
        <SummaryCard tone="income" icon={TrendingUp} label="Total pemasukan" value={formatCurrency(summary.income)} />
        <SummaryCard
          tone="expense"
          icon={TrendingDown}
          label="Total pengeluaran"
          value={formatCurrency(summary.expense)}
        />
        <SummaryCard
          tone="neutral"
          icon={PiggyBank}
          label="Saving rate"
          value={formatPercent(summary.savingRate, 1)}
          hint={summary.savingRate === null ? "Belum ada pemasukan" : "Bagian pemasukan yang tersisa"}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      {periodTransactions.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={`Belum ada transaksi di ${periodLabel.toLowerCase()}`}
          description="Tambahkan transaksi baru, atau ubah periode ke Semua data untuk melihat catatan sebelumnya."
        >
          <button type="button" onClick={() => onAdd()} className="btn btn-primary">
            <Plus size={18} strokeWidth={2} aria-hidden="true" />
            Tambah Transaksi
          </button>
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-5">
            <Panel
              title="Pemasukan vs pengeluaran"
              description={`${periodLabel}, per ${series.unit}`}
              className="lg:col-span-3"
            >
              <IncomeExpenseChart data={series.data} unit={series.unit} />
            </Panel>
            <Panel title="Pengeluaran per kategori" description={periodLabel} className="lg:col-span-2">
              {categories.length > 0 ? (
                <CategoryBreakdown data={categories} total={summary.expense} />
              ) : (
                <p className="py-8 text-sm text-ink-soft">Belum ada pengeluaran pada periode ini.</p>
              )}
            </Panel>
          </div>

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-5">
            <Panel
              title="Tren saldo"
              description="Saldo kumulatif dari seluruh transaksi, di akhir tiap bulan"
              className="lg:col-span-3"
            >
              <BalanceTrendChart data={trend} />
            </Panel>
            <Panel title="Ringkasan anggaran" description={formatMonthLabel(budgetMonth)} className="lg:col-span-2">
              {budgetRows.length > 0 ? (
                <>
                  <ul className="divide-y divide-line">
                    {budgetRows.slice(0, 4).map((row) => (
                      <BudgetProgress
                        key={row.budget.category}
                        category={row.budget.category}
                        limit={row.budget.limit}
                        {...row}
                      />
                    ))}
                  </ul>
                  <button type="button" onClick={() => onNavigate("budgets")} className="btn btn-secondary mt-4 w-full">
                    Kelola anggaran
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-start gap-3 py-2">
                  <p className="text-sm leading-relaxed text-ink-soft">
                    Belum ada anggaran untuk bulan ini. Tetapkan batas pengeluaran per kategori agar mudah memantau.
                  </p>
                  <button type="button" onClick={() => onNavigate("budgets")} className="btn btn-secondary">
                    Buat anggaran
                  </button>
                </div>
              )}
            </Panel>
          </div>

          <Panel title="Transaksi terbaru" description={periodLabel}>
            <TransactionTable transactions={recent} />
            <button type="button" onClick={() => onNavigate("transactions")} className="btn btn-secondary mt-4">
              Lihat semua transaksi
            </button>
          </Panel>
        </>
      )}
    </div>
  );
}
