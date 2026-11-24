import { useMemo, useRef, useState } from "react";
import { Copy, Loader2, Pencil, Target, Trash2, X } from "lucide-react";
import BudgetProgress from "../components/BudgetProgress.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Field from "../components/Field.jsx";
import { describedBy } from "../utils/formHelpers.js";
import MonthPicker from "../components/MonthPicker.jsx";
import { EXPENSE_CATEGORIES } from "../utils/constants.js";
import { addMonths, currentMonthKey, daysInMonth, formatMonthLabel, monthKeyOf } from "../utils/dates.js";
import { formatCurrency, formatDigitsInput, formatPercent } from "../utils/formatCurrency.js";
import { budgetUsageForMonth, getBudgetsForMonth } from "../utils/financeCalculations.js";
import { validateBudgetInput } from "../utils/validation.js";

export default function Budgets({ transactions, budgets, onSave, onDelete, onCopyMonth, onDrillDown }) {
  const [today] = useState(() => {
    const d = new Date();
    return { month: currentMonthKey(d), day: d.getDate() };
  });
  const todayMonth = today.month;
  const [month, setMonth] = useState(todayMonth);
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [errors, setErrors] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);
  const limitRef = useRef(null);
  const formRef = useRef(null);

  const prevMonth = addMonths(month, -1);
  const totalDays = daysInMonth(month);
  const pacePercent = month === todayMonth ? Math.min(100, (today.day / totalDays) * 100) : null;

  const rows = useMemo(() => budgetUsageForMonth(budgets, transactions, month), [budgets, transactions, month]);
  const prevBudgets = useMemo(() => getBudgetsForMonth(budgets, prevMonth), [budgets, prevMonth]);
  const existing = budgets.find((b) => b.month === month && b.category === category);

  const overall = useMemo(() => {
    const totalLimit = rows.reduce((sum, r) => sum + r.budget.limit, 0);
    const totalSpent = rows.reduce((sum, r) => sum + r.spent, 0);
    const percent = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;
    return { totalLimit, totalSpent, remaining: totalLimit - totalSpent, percent };
  }, [rows]);

  const categoryContext = useMemo(() => {
    if (!category) return null;
    let thisMonthSpent = 0;
    let lastMonthSpent = 0;
    for (const t of transactions) {
      if (t.type !== "expense" || t.category !== category) continue;
      const key = monthKeyOf(t.date);
      if (key === month) thisMonthSpent += t.amount;
      else if (key === prevMonth) lastMonthSpent += t.amount;
    }
    return { thisMonthSpent, lastMonthSpent };
  }, [category, transactions, month, prevMonth]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;
    const result = validateBudgetInput({ month, category, limit });
    if (!result.valid) {
      setErrors(result.errors);
      setTimeout(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    setSaving(true);
    try {
      const ok = await onSave(result.clean, Boolean(existing));
      if (ok !== false) {
        setCategory("");
        setLimit("");
        setEditingCategory(null);
        setErrors({});
      }
    } finally {
      setSaving(false);
    }
  }

  function startEdit(budget) {
    setCategory(budget.category);
    setLimit(String(budget.limit));
    setEditingCategory(budget.category);
    setErrors({});
    limitRef.current?.focus();
    limitRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function cancelEdit() {
    setCategory("");
    setLimit("");
    setEditingCategory(null);
    setErrors({});
  }

  async function handleCopyFromPrev() {
    if (!onCopyMonth || copying || prevBudgets.length === 0) return;
    setCopying(true);
    try {
      await onCopyMonth(prevMonth, month);
    } finally {
      setCopying(false);
    }
  }

  const limitPreview = /^\d+$/.test(limit) && Number(limit) > 0 ? formatCurrency(Number(limit)) : null;

  const limitHint = existing
    ? `Batas saat ini ${formatCurrency(existing.limit)}${limitPreview ? ` → baru: ${limitPreview}` : ""}. Menyimpan akan memperbaruinya.`
    : limitPreview
      ? `Terbaca sebagai ${limitPreview}`
      : "Tulis angka saja, contoh: 500.000";

  return (
    <div className="grid gap-5 xl:grid-cols-[410px_1fr] xl:items-start">
      <section className="card p-5 xl:sticky xl:top-28">
        <h2 className="text-base font-semibold tracking-tight">Atur anggaran bulanan</h2>
        <p className="mt-0.5 text-sm text-ink-soft text-pretty">
          Tetapkan batas pengeluaran per kategori. Peringatan muncul otomatis saat pemakaian mencapai 80%.
        </p>

        <div className="mt-5">
          <MonthPicker
            idPrefix="budget"
            value={month}
            onChange={(value) => {
              setMonth(value);
              setEditingCategory(null);
              setErrors({});
            }}
          />
        </div>

        <form ref={formRef} onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-4">
          <Field id="b-category" label="Kategori pengeluaran" error={errors.category}>
            <select
              id="b-category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setErrors((c) => ({ ...c, category: undefined }));
              }}
              className="input"
              aria-invalid={Boolean(errors.category)}
              aria-describedby={describedBy("b-category", errors.category)}
              disabled={saving}
            >
              <option value="">Pilih kategori</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field id="b-limit" label="Batas per bulan (Rupiah)" error={errors.limit} hint={limitHint}>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-medium text-ink-soft"
              >
                Rp
              </span>
              <input
                id="b-limit"
                ref={limitRef}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={formatDigitsInput(limit)}
                onChange={(e) => {
                  setLimit(e.target.value.replace(/\D/g, ""));
                  setErrors((c) => ({ ...c, limit: undefined }));
                }}
                placeholder="500.000"
                className="input pl-10 tabular-nums"
                aria-invalid={Boolean(errors.limit)}
                aria-describedby={describedBy("b-limit", errors.limit, true)}
                disabled={saving}
              />
            </div>
          </Field>

          {categoryContext ? (
            <p className="rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-xs text-ink-soft tabular-nums">
              Realisasi <span className="font-medium text-ink">{category}</span>: bulan ini{" "}
              <span className="font-medium text-ink">{formatCurrency(categoryContext.thisMonthSpent)}</span>
              {" · "}bulan lalu{" "}
              <span className="font-medium text-ink">{formatCurrency(categoryContext.lastMonthSpent)}</span>.
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" disabled={saving} className="btn btn-primary flex-1 sm:flex-none">
              {saving ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : null}
              {saving ? "Menyimpan..." : existing ? "Perbarui Anggaran" : "Simpan Anggaran"}
            </button>

            {editingCategory ? (
              <button type="button" onClick={cancelEdit} disabled={saving} className="btn btn-secondary">
                <X size={16} strokeWidth={1.75} aria-hidden="true" />
                Batal ubah
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <div className="flex flex-col gap-5">
        {rows.length > 0 ? (
          <section className="hero-deck p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-xs text-hero-soft">Total pemakaian anggaran · {formatMonthLabel(month)}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                  <span className="money-mask">{formatCurrency(overall.totalSpent)}</span>{" "}
                  <span className="money-mask text-sm font-normal text-hero-soft">
                    dari {formatCurrency(overall.totalLimit)}
                  </span>
                </p>
              </div>
              <span className="badge border-hero-line bg-hero-surface text-hero-ink tabular-nums">
                {formatPercent(overall.percent, 0)} terpakai
              </span>
            </div>

            <div className="relative mt-4">
              <div className="h-2.5 overflow-hidden rounded-full bg-hero-surface ring-1 ring-hero-line">
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ${
                    overall.percent >= 100 ? "bg-expense" : overall.percent >= 80 ? "bg-warn-bar" : "bg-income"
                  }`}
                  style={{ width: `${Math.min(overall.percent, 100)}%` }}
                />
              </div>
              {pacePercent !== null && pacePercent > 2 && pacePercent < 98 ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-0.5 -bottom-0.5 w-0.5 rounded-full bg-hero-ink/80"
                  style={{ left: `${pacePercent}%` }}
                />
              ) : null}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-hero-soft tabular-nums">
              <span className="money-mask">
                {overall.remaining < 0
                  ? `Melebihi total batas sebesar ${formatCurrency(-overall.remaining)}`
                  : `Sisa ruang anggaran ${formatCurrency(overall.remaining)}`}
              </span>
              {pacePercent !== null ? (
                <span>
                  Penanda kalender: hari ke-{today.day} dari {totalDays} ({formatPercent(pacePercent, 0)})
                </span>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold tracking-tight">Rincian kategori, {formatMonthLabel(month)}</h2>
            {rows.length > 0 && pacePercent !== null ? (
              <span className="text-xs text-ink-soft">Garis vertikal = posisi hari ini</span>
            ) : null}
          </div>

          <div className="mt-4">
            {rows.length > 0 ? (
              <ul className="divide-y divide-line">
                {rows.map((row) => (
                  <BudgetProgress
                    key={row.budget.category}
                    category={row.budget.category}
                    limit={row.budget.limit}
                    pacePercent={pacePercent}
                    onSelectCategory={
                      onDrillDown
                        ? (cat) =>
                            onDrillDown({
                              type: "expense",
                              category: cat,
                              dateFrom: `${month}-01`,
                              dateTo: `${month}-${String(totalDays).padStart(2, "0")}`,
                            })
                        : undefined
                    }
                    {...row}
                    actions={
                      <div className="-my-2 -mr-2 flex">
                        <button
                          type="button"
                          onClick={() => startEdit(row.budget)}
                          className="btn-icon"
                          aria-label={`Ubah anggaran ${row.budget.category}`}
                          title="Ubah"
                        >
                          <Pencil size={17} strokeWidth={1.75} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(row.budget)}
                          className="btn-icon hover:bg-expense-soft hover:text-expense"
                          aria-label={`Hapus anggaran ${row.budget.category}`}
                          title="Hapus"
                        >
                          <Trash2 size={17} strokeWidth={1.75} aria-hidden="true" />
                        </button>
                      </div>
                    }
                  />
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Target}
                headingAs="h3"
                boxed={false}
                title={`Belum ada anggaran untuk ${formatMonthLabel(month)}`}
                description="Pilih kategori dan isi batas pengeluaran di formulir samping. Pemakaian dihitung otomatis dari transaksi pengeluaran pada bulan dan kategori yang sama."
              >
                {prevBudgets.length > 0 && onCopyMonth ? (
                  <button
                    type="button"
                    onClick={handleCopyFromPrev}
                    disabled={copying}
                    className="btn btn-secondary"
                  >
                    {copying ? (
                      <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Copy size={17} strokeWidth={1.75} aria-hidden="true" />
                    )}
                    {copying
                      ? "Menyalin..."
                      : `Salin ${prevBudgets.length} anggaran dari ${formatMonthLabel(prevMonth)}`}
                  </button>
                ) : null}
              </EmptyState>
            )}
          </div>
        </section>
      </div>

      {pendingDelete ? (
        <ConfirmDialog
          danger
          title="Hapus anggaran ini?"
          message={`Anggaran ${pendingDelete.category} untuk ${formatMonthLabel(pendingDelete.month)} akan dihapus. Transaksi Anda tidak berubah.`}
          confirmLabel="Hapus"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            onDelete(pendingDelete);
            setPendingDelete(null);
          }}
        />
      ) : null}
    </div>
  );
}
