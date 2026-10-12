import { useMemo, useRef, useState } from "react";
import { Pencil, Target, Trash2 } from "lucide-react";
import BudgetProgress from "../components/BudgetProgress.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Field from "../components/Field.jsx";
import { describedBy } from "../utils/formHelpers.js";
import MonthPicker from "../components/MonthPicker.jsx";
import { EXPENSE_CATEGORIES } from "../utils/constants.js";
import { currentMonthKey, formatMonthLabel } from "../utils/dates.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { budgetUsageForMonth } from "../utils/financeCalculations.js";
import { validateBudgetInput } from "../utils/validation.js";

export default function Budgets({ transactions, budgets, onSave, onDelete }) {
  const [month, setMonth] = useState(currentMonthKey());
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [errors, setErrors] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);
  const limitRef = useRef(null);
  const formRef = useRef(null);

  const rows = useMemo(() => budgetUsageForMonth(budgets, transactions, month), [budgets, transactions, month]);
  const existing = budgets.find((b) => b.month === month && b.category === category);

  function handleSubmit(event) {
    event.preventDefault();
    const result = validateBudgetInput({ month, category, limit });
    if (!result.valid) {
      setErrors(result.errors);
      setTimeout(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    onSave(result.clean, Boolean(existing));
    setCategory("");
    setLimit("");
    setErrors({});
  }

  function startEdit(budget) {
    setCategory(budget.category);
    setLimit(String(budget.limit));
    setErrors({});
    limitRef.current?.focus();
    limitRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <section className="card p-5">
        <h2 className="text-base font-semibold tracking-tight">Anggaran bulanan</h2>
        <p className="mt-0.5 text-sm text-ink-soft">
          Tetapkan batas pengeluaran per kategori untuk bulan yang dipilih.
        </p>

        <div className="mt-5">
          <MonthPicker
            idPrefix="budget"
            value={month}
            onChange={(value) => {
              setMonth(value);
              setErrors({});
            }}
          />
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
        >
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
            >
              <option value="">Pilih kategori</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id="b-limit"
            label="Batas per bulan (Rupiah)"
            error={errors.limit}
            hint={
              existing
                ? `Sudah ada anggaran ${formatCurrency(existing.limit)}. Menyimpan akan memperbaruinya.`
                : "Tulis angka saja, contoh: 500000"
            }
          >
            <input
              id="b-limit"
              ref={limitRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={limit}
              onChange={(e) => {
                setLimit(e.target.value.replace(/\D/g, ""));
                setErrors((c) => ({ ...c, limit: undefined }));
              }}
              className="input tabular-nums"
              aria-invalid={Boolean(errors.limit)}
              aria-describedby={describedBy("b-limit", errors.limit, true)}
            />
          </Field>
          <div className="sm:pt-[1.85rem]">
            <button type="submit" className="btn btn-primary w-full sm:w-auto">
              {existing ? "Perbarui Anggaran" : "Simpan Anggaran"}
            </button>
          </div>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="text-base font-semibold tracking-tight">Pemakaian anggaran, {formatMonthLabel(month)}</h2>
        <div className="mt-4">
          {rows.length > 0 ? (
            <ul className="divide-y divide-line">
              {rows.map((row) => (
                <BudgetProgress
                  key={row.budget.category}
                  category={row.budget.category}
                  limit={row.budget.limit}
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
                        <Pencil size={18} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(row.budget)}
                        className="btn-icon hover:bg-expense-soft hover:text-expense"
                        aria-label={`Hapus anggaran ${row.budget.category}`}
                        title="Hapus"
                      >
                        <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                    </div>
                  }
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Target}
              title={`Belum ada anggaran untuk ${formatMonthLabel(month)}`}
              description="Pilih kategori dan isi batas pengeluaran di formulir di atas. Pemakaian dihitung otomatis dari transaksi pengeluaran pada bulan dan kategori yang sama."
            />
          )}
        </div>
      </section>

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
