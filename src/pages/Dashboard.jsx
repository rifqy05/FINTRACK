import { useMemo, useState } from "react";
import { ArrowRight, FlaskConical, Inbox, Plus, Repeat, TrendingDown, TrendingUp } from "lucide-react";
import EmptyState from "../components/EmptyState.jsx";
import CategoryBreakdown from "../components/CategoryBreakdown.jsx";
import TransactionTable from "../components/TransactionTable.jsx";
import BudgetProgress from "../components/BudgetProgress.jsx";
import QuickAddCard from "../components/QuickAddCard.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { BalanceTrendChart, IncomeExpenseChart } from "../components/Charts.jsx";
import { addMonths, currentMonthKey, daysInMonth, formatMonthLabel } from "../utils/dates.js";
import { formatCurrency, formatPercent } from "../utils/formatCurrency.js";
import {
  budgetUsageForMonth,
  buildBalanceTrend,
  buildIncomeExpenseSeries,
  expenseByCategory,
  filterByMonth,
  filterByPeriod,
  sortNewestFirst,
  summarize,
} from "../utils/financeCalculations.js";

function Panel({ title, description, action, children, className = "" }) {
  return (
    <section className={`card flex min-w-0 flex-col p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-ink-soft text-pretty">{description}</p> : null}
        </div>
        {action ? <div className="-mt-2 -mr-2 shrink-0">{action}</div> : null}
      </div>
      <div className="mt-4 flex flex-1 flex-col">{children}</div>
    </section>
  );
}

export default function Dashboard({
  transactions,
  budgets,
  period,
  onNavigate,
  onDrillDown,
  onAdd,
  onQuickSubmit,
  onEdit,
  onDelete,
  onLoadDemo,
  pendingRecurringCount = 0,
  onOpenRecurring,
}) {
  const [pendingDelete, setPendingDelete] = useState(null);
  const [today] = useState(() => {
    const d = new Date();
    return { month: currentMonthKey(d), day: d.getDate() };
  });
  const todayMonth = today.month;
  const isMonth = period.type === "month";
  const budgetMonth = isMonth ? period.month : todayMonth;
  const totalDays = daysInMonth(budgetMonth);
  const pacePercent = budgetMonth === todayMonth ? Math.min(100, (today.day / totalDays) * 100) : null;

  const periodTransactions = useMemo(() => filterByPeriod(transactions, period), [transactions, period]);
  const summary = useMemo(() => summarize(periodTransactions), [periodTransactions]);
  const prevExpense = useMemo(
    () => (isMonth ? summarize(filterByMonth(transactions, addMonths(period.month, -1))).expense : 0),
    [transactions, isMonth, period.month],
  );
  const series = useMemo(() => buildIncomeExpenseSeries(transactions, period), [transactions, period]);
  const categories = useMemo(() => expenseByCategory(periodTransactions), [periodTransactions]);
  const trend = useMemo(() => buildBalanceTrend(transactions, period, todayMonth), [transactions, period, todayMonth]);
  const recent = useMemo(() => sortNewestFirst(periodTransactions).slice(0, 6), [periodTransactions]);
  const budgetRows = useMemo(
    () => budgetUsageForMonth(budgets, transactions, budgetMonth),
    [budgets, transactions, budgetMonth],
  );

  const periodLabel = isMonth ? formatMonthLabel(period.month) : "Semua data";
  const periodSentence = isMonth ? `periode ${periodLabel}` : "semua data";
  const expenseDelta =
    isMonth && prevExpense > 0
      ? {
          up: summary.expense >= prevExpense,
          percent: (Math.abs(summary.expense - prevExpense) / prevExpense) * 100,
        }
      : null;

  const spentRatio =
    summary.income > 0 ? Math.min(100, (summary.expense / summary.income) * 100) : summary.expense > 0 ? 100 : 0;
  const savedRatio = summary.income > 0 ? Math.max(0, 100 - spentRatio) : 0;

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

  function drillCategory(category, monthKey = null) {
    if (!onDrillDown) return;
    if (monthKey) {
      const last = String(daysInMonth(monthKey)).padStart(2, "0");
      onDrillDown({ type: "expense", category, dateFrom: `${monthKey}-01`, dateTo: `${monthKey}-${last}` });
    } else {
      onDrillDown({ type: "expense", category });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {pendingRecurringCount > 0 && onOpenRecurring ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-xs">
          <span className="flex items-center gap-2 text-ink">
            <Repeat size={14} strokeWidth={2} aria-hidden="true" className="shrink-0 text-ink-soft" />
            Ada <strong className="font-semibold tabular-nums">{pendingRecurringCount}</strong> template transaksi rutin
            bulan ini yang belum dicatat.
          </span>
          <button type="button" onClick={onOpenRecurring} className="btn btn-secondary min-h-9 px-3 text-xs">
            Catat rutin
          </button>
        </div>
      ) : null}

      {/* Baris 1: Dek Saldo & Arus Kas terpadu (8 col) + Catat Cepat inline (4 col) */}
      <div className="grid gap-4 sm:gap-5 xl:grid-cols-12">
        <section className="hero-deck flex flex-col justify-between p-4 sm:p-6 xl:col-span-8">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-hero-soft">Saldo bersih · {periodLabel}</h2>
              <span className="badge border-hero-line bg-hero-surface text-hero-soft">
                {periodTransactions.length} transaksi
              </span>
            </div>

            <p className="money-mask mt-2 text-3xl leading-[1.08] font-semibold tracking-[-0.03em] tabular-nums sm:mt-2.5 sm:text-[2.625rem] xl:text-[3rem]">
              {formatCurrency(summary.balance)}
            </p>
            <p className="mt-1 text-xs text-hero-soft">
              Selisih pemasukan dan pengeluaran pada {periodSentence}.
            </p>

            {/* Pita proporsi alokasi pemasukan -> terpakai vs tersimpan */}
            <div className="mt-4 sm:mt-5">
              <div className="flex items-center justify-between text-xs text-hero-soft tabular-nums">
                <span>
                  Terpakai <strong className="font-medium text-hero-ink">{formatPercent(spentRatio, 0)}</strong>
                </span>
                <span>
                  {summary.balance >= 0 ? (
                    <>
                      Tersisa <strong className="font-medium text-income">{formatPercent(savedRatio, 0)}</strong>
                    </>
                  ) : (
                    <strong className="font-medium text-expense">Pengeluaran melebihi pemasukan</strong>
                  )}
                </span>
              </div>
              <div
                aria-hidden="true"
                className="ribbon-reveal mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-hero-surface ring-1 ring-hero-line"
              >
                {spentRatio > 0 ? (
                  <div
                    className="h-full bg-expense transition-[width] duration-300"
                    style={{ width: `${spentRatio}%` }}
                  />
                ) : null}
                {savedRatio > 0 ? (
                  <div
                    className="h-full bg-income transition-[width] duration-300"
                    style={{ width: `${savedRatio}%` }}
                  />
                ) : null}
              </div>
            </div>
          </div>

          {/* Strip 3 metrik: 2 kolom + baris rasio ringkas di ponsel; 3 kolom garis tipis di layar lebar */}
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-hero-line pt-4 sm:mt-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-hero-line sm:pt-5">
            <div className="sm:pr-5">
              <p className="flex items-center gap-1.5 text-xs text-hero-soft">
                <span className="size-2 shrink-0 rounded-full bg-income" aria-hidden="true" />
                Total pemasukan
              </p>
              <p className="money-mask mt-1 text-lg font-semibold tracking-tight text-hero-ink tabular-nums sm:mt-1.5 sm:text-xl">
                {formatCurrency(summary.income)}
              </p>
            </div>

            <div className="sm:px-5">
              <p className="flex items-center gap-1.5 text-xs text-hero-soft">
                <span className="size-2 shrink-0 rounded-full bg-expense" aria-hidden="true" />
                Total pengeluaran
              </p>
              <p className="money-mask mt-1 text-lg font-semibold tracking-tight text-hero-ink tabular-nums sm:mt-1.5 sm:text-xl">
                {formatCurrency(summary.expense)}
              </p>
              {expenseDelta ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-hero-soft tabular-nums">
                  {expenseDelta.up ? (
                    <TrendingUp size={13} className="shrink-0 text-expense" aria-hidden="true" />
                  ) : (
                    <TrendingDown size={13} className="shrink-0 text-income" aria-hidden="true" />
                  )}
                  <span>
                    {expenseDelta.up ? "Naik" : "Turun"} {formatPercent(expenseDelta.percent, 0)} vs bulan lalu
                  </span>
                </p>
              ) : null}
            </div>

            <div className="col-span-2 flex items-baseline justify-between gap-2 border-t border-hero-line pt-3 sm:col-span-1 sm:block sm:border-t-0 sm:pt-0 sm:pl-5">
              <p className="flex items-center gap-1.5 text-xs text-hero-soft">
                <span className="size-2 shrink-0 rounded-full bg-income" aria-hidden="true" />
                Rasio tabungan
              </p>
              <div className="text-right sm:text-left">
                <p className="text-lg font-semibold tracking-tight text-hero-ink tabular-nums sm:mt-1.5 sm:text-xl">
                  {formatPercent(summary.savingRate, 1)}
                </p>
                <p className="mt-0.5 hidden text-xs text-hero-soft sm:block">
                  {summary.savingRate === null ? "Belum ada pemasukan" : "Porsi pemasukan yang tersisa"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="xl:col-span-4">
          <QuickAddCard onSubmit={onQuickSubmit} onOpenFullForm={onAdd} />
        </div>
      </div>

      {periodTransactions.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={isMonth ? `Belum ada transaksi di ${periodLabel}` : "Belum ada transaksi"}
          description="Catat transaksi baru lewat kotak Catat cepat di atas, atau beralih ke Semua data untuk melihat riwayat sebelumnya."
        />
      ) : (
        <>
          {/* Baris 2: Grafik Arus Kas & Proporsi Kategori */}
          <div className="grid gap-5 lg:grid-cols-12">
            <Panel
              title="Pemasukan vs pengeluaran"
              description={`${periodLabel}, diringkas per ${series.unit}`}
              className="lg:col-span-7"
            >
              <IncomeExpenseChart data={series.data} unit={series.unit} />
            </Panel>
            <Panel
              title="Pengeluaran per kategori"
              description={`${periodLabel} · klik kategori untuk melihat transaksi`}
              className="lg:col-span-5"
            >
              {categories.length > 0 ? (
                <CategoryBreakdown
                  data={categories}
                  total={summary.expense}
                  onSelectCategory={(cat) => drillCategory(cat, isMonth ? period.month : null)}
                />
              ) : (
                <p className="py-8 text-sm text-ink-soft">Belum ada pengeluaran pada periode ini.</p>
              )}
            </Panel>
          </div>

          {/* Baris 3: Tren Saldo (Area Gradient) & Laju Anggaran */}
          <div className="grid gap-5 lg:grid-cols-12">
            <Panel
              title="Tren saldo"
              description="Saldo kumulatif dari seluruh transaksi, di akhir tiap bulan"
              className="lg:col-span-7"
            >
              <BalanceTrendChart data={trend} />
            </Panel>
            <Panel
              title="Ringkasan anggaran"
              description={
                pacePercent !== null
                  ? `${formatMonthLabel(budgetMonth)} · garis vertikal menandai hari ke-${today.day} dari ${totalDays}`
                  : formatMonthLabel(budgetMonth)
              }
              action={
                budgetRows.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => onNavigate("budgets")}
                    className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs font-medium text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
                  >
                    Kelola
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                ) : null
              }
              className="lg:col-span-5"
            >
              {budgetRows.length > 0 ? (
                <ul className="divide-y divide-line">
                  {budgetRows.slice(0, 4).map((row) => (
                    <BudgetProgress
                      key={row.budget.category}
                      category={row.budget.category}
                      limit={row.budget.limit}
                      pacePercent={pacePercent}
                      onSelectCategory={(cat) => drillCategory(cat, budgetMonth)}
                      {...row}
                    />
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-start gap-3 py-2">
                  <p className="text-sm leading-relaxed text-ink-soft text-pretty">
                    Belum ada anggaran untuk bulan ini. Tetapkan batas pengeluaran per kategori agar laju belanja mudah
                    dipantau.
                  </p>
                  <button type="button" onClick={() => onNavigate("budgets")} className="btn btn-secondary">
                    Buat anggaran
                  </button>
                </div>
              )}
            </Panel>
          </div>

          {/* Baris 4: Buku Kas Transaksi Terbaru */}
          <Panel
            title="Transaksi terbaru"
            description={periodLabel}
            action={
              <button
                type="button"
                onClick={() => onNavigate("transactions")}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
              >
                Lihat semua transaksi
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            }
          >
            <TransactionTable
              transactions={recent}
              onEdit={onEdit}
              onDelete={onDelete ? setPendingDelete : undefined}
            />
          </Panel>
        </>
      )}

      {pendingDelete && onDelete ? (
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
