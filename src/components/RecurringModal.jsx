import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Loader2, Plus, Repeat, Trash2 } from "lucide-react";
import Modal from "./Modal.jsx";
import Field from "./Field.jsx";
import { PAYMENT_METHODS, categoriesFor } from "../utils/constants.js";
import { currentMonthKey, formatMonthLabel } from "../utils/dates.js";
import { formatCurrency, formatDigitsInput } from "../utils/formatCurrency.js";
import { isRecurringRecordedInMonth, validateRecurringInput } from "../utils/recurring.js";

// Dialog pengelolaan template transaksi rutin bulanan (Kos, Paket data, Gaji, Langganan, dll.).
export default function RecurringModal({
  templates,
  transactions,
  onAddTemplate,
  onDeleteTemplate,
  onApplyMonth,
  onClose,
}) {
  const monthKey = currentMonthKey();
  const monthLabel = formatMonthLabel(monthKey);

  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("Tagihan");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Transfer");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [errors, setErrors] = useState({});
  const [applying, setApplying] = useState(false);

  const categories = categoriesFor(type);
  const pendingCount = templates.filter((tpl) => !isRecurringRecordedInMonth(tpl, monthKey, transactions)).length;

  function switchType(nextType) {
    setType(nextType);
    setCategory(categoriesFor(nextType)[0] ?? "");
    setErrors({});
  }

  function handleAdd(event) {
    event.preventDefault();
    const res = validateRecurringInput({ type, category, amount, description, paymentMethod, dayOfMonth });
    if (!res.valid) {
      setErrors(res.errors);
      return;
    }
    onAddTemplate(res.clean);
    setAmount("");
    setDescription("");
    setErrors({});
  }

  async function handleApply() {
    if (applying || pendingCount === 0) return;
    setApplying(true);
    try {
      await onApplyMonth(monthKey);
    } finally {
      setApplying(false);
    }
  }

  return (
    <Modal title="Template Transaksi Rutin" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <p className="text-sm leading-relaxed text-ink-soft text-pretty">
          Simpan pemasukan atau tagihan bulanan tetap (seperti gaji, kos, atau paket data) agar bisa dicatat ke bulan
          berjalan dalam satu klik tanpa duplikasi.
        </p>

        {/* Daftar template tersimpan */}
        {templates.length > 0 ? (
          <div className="rounded-xl border border-line bg-surface-2/40">
            <ul className="divide-y divide-line">
              {templates.map((tpl) => {
                const recorded = isRecurringRecordedInMonth(tpl, monthKey, transactions);
                const isIncome = tpl.type === "income";
                return (
                  <li key={tpl.id} className="flex items-center justify-between gap-3 px-3.5 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium text-ink">{tpl.description || tpl.category}</span>
                        {recorded ? (
                          <span className="badge bg-income-soft text-income">
                            <CheckCircle2 size={12} strokeWidth={2} aria-hidden="true" />
                            Sudah dicatat
                          </span>
                        ) : (
                          <span className="badge border-line bg-surface text-ink-soft">Tgl {tpl.dayOfMonth}</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {tpl.category} · {tpl.paymentMethod}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={`money-mask text-sm font-semibold tabular-nums ${
                          isIncome ? "text-income" : "text-expense"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(tpl.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteTemplate(tpl.id)}
                        className="btn-icon hover:bg-expense-soft hover:text-expense"
                        aria-label={`Hapus template ${tpl.description || tpl.category}`}
                        title="Hapus template"
                      >
                        <Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3.5 py-3">
              <span className="text-xs text-ink-soft">
                {pendingCount > 0
                  ? `${pendingCount} transaksi rutin belum dicatat untuk ${monthLabel}.`
                  : `Semua transaksi rutin sudah tercatat untuk ${monthLabel}.`}
              </span>
              <button
                type="button"
                disabled={pendingCount === 0 || applying}
                onClick={handleApply}
                className="btn btn-primary text-xs"
              >
                {applying ? (
                  <Loader2 size={15} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Repeat size={15} strokeWidth={2} aria-hidden="true" />
                )}
                {applying ? "Mencatat..." : `Catat ${pendingCount} rutin (${monthLabel})`}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-surface-2/30 px-4 py-5 text-center text-xs text-ink-soft">
            Belum ada template rutin. Tambahkan pemasukan atau pengeluaran tetap pertama Anda di bawah.
          </div>
        )}

        {/* Formulir tambah template rutin baru */}
        <form onSubmit={handleAdd} noValidate className="flex flex-col gap-3 border-t border-line pt-4">
          <h3 className="text-sm font-semibold">Tambah template rutin</h3>

          <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-line bg-surface-2 p-1">
            {[
              { value: "expense", label: "Pengeluaran", icon: ArrowDownRight, active: "bg-surface text-expense border border-line" },
              { value: "income", label: "Pemasukan", icon: ArrowUpRight, active: "bg-surface text-income border border-line" },
            ].map(({ value, label, icon: Icon, active }) => (
              <button
                key={value}
                type="button"
                aria-pressed={type === value}
                onClick={() => switchType(value)}
                className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  type === value ? active : "text-ink-soft hover:text-ink"
                }`}
              >
                <Icon size={15} strokeWidth={2} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="rec-cat" label="Kategori" error={errors.category}>
              <select
                id="rec-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field id="rec-amount" label="Nominal (Rupiah)" error={errors.amount}>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-medium text-ink-soft"
                >
                  Rp
                </span>
                <input
                  id="rec-amount"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={formatDigitsInput(amount)}
                  onChange={(e) => {
                    setAmount(e.target.value.replace(/\D/g, ""));
                    setErrors((c) => ({ ...c, amount: undefined }));
                  }}
                  placeholder="1.200.000"
                  className="input pl-10 tabular-nums"
                  aria-invalid={Boolean(errors.amount)}
                />
              </div>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Field id="rec-desc" label="Keterangan" error={errors.description}>
                <input
                  id="rec-desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Kos bulan ini"
                  maxLength={120}
                  className="input"
                />
              </Field>
            </div>

            <Field id="rec-day" label="Tanggal (1–28)">
              <input
                id="rec-day"
                type="number"
                min={1}
                max={28}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className="input tabular-nums"
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-36 flex-1">
              <Field id="rec-method" label="Metode pembayaran">
                <select
                  id="rec-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="input"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <button type="submit" className="btn btn-secondary">
              <Plus size={16} strokeWidth={2} aria-hidden="true" />
              Simpan Template
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
