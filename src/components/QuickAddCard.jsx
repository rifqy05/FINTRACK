import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Loader2, Plus } from "lucide-react";
import { PAYMENT_METHODS, categoriesFor } from "../utils/constants.js";
import { todayISO } from "../utils/dates.js";
import { formatDigitsInput } from "../utils/formatCurrency.js";
import { loadLastPaymentMethod, saveLastPaymentMethod } from "../utils/storage.js";
import { validateTransactionInput } from "../utils/validation.js";

const QUICK_AMOUNTS = [
  { label: "15rb", value: "15000" },
  { label: "25rb", value: "25000" },
  { label: "50rb", value: "50000" },
  { label: "100rb", value: "100000" },
];

// Formulir catat cepat langsung di Dashboard (chip nominal cepat + pilih metode tanpa membuka dialog).
export default function QuickAddCard({ onSubmit, onOpenFullForm }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Makanan");
  const [paymentMethod, setPaymentMethod] = useState(loadLastPaymentMethod);
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const categories = categoriesFor(type);

  function switchType(nextType) {
    setType(nextType);
    const nextList = categoriesFor(nextType);
    setCategory(nextList[0] ?? "");
    setError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    const result = validateTransactionInput({
      type,
      date: todayISO(),
      category,
      amount,
      description,
      paymentMethod,
    });
    if (!result.valid) {
      setError(Object.values(result.errors)[0] ?? "Periksa kembali isian Anda.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const ok = await onSubmit(result.clean, null, { keepOpen: true });
      if (ok !== false) {
        saveLastPaymentMethod(result.clean.paymentMethod);
        setAmount("");
        setDescription("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card @container flex h-full flex-col justify-between p-5">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold tracking-tight">Catat cepat</h2>
          {onOpenFullForm ? (
            <button
              type="button"
              onClick={() => onOpenFullForm()}
              className="min-h-11 rounded-lg px-2 text-xs font-medium text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
            >
              Opsi lengkap
            </button>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-ink-soft">Tanggal hari ini · pilih cepat nominal &amp; metode</p>

        <form onSubmit={handleSubmit} noValidate className="mt-3.5 flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-line bg-surface-2 p-1">
            {[
              { value: "expense", label: "Keluar", icon: ArrowDownRight, active: "bg-surface text-expense border border-line" },
              { value: "income", label: "Masuk", icon: ArrowUpRight, active: "bg-surface text-income border border-line" },
            ].map(({ value, label, icon: Icon, active }) => {
              const selected = type === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  disabled={submitting}
                  onClick={() => switchType(value)}
                  className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selected ? active : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <Icon size={15} strokeWidth={2} aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-2.5 @[340px]:grid-cols-2">
            <div className="relative">
              <label htmlFor="quick-amount" className="sr-only">
                Nominal Rupiah
              </label>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-medium text-ink-soft"
              >
                Rp
              </span>
              <input
                id="quick-amount"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={formatDigitsInput(amount)}
                onChange={(e) => {
                  setAmount(e.target.value.replace(/\D/g, ""));
                  setError(null);
                }}
                placeholder="35.000"
                className="input pl-10 font-medium tabular-nums"
                aria-invalid={Boolean(error)}
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="quick-category" className="sr-only">
                Kategori
              </label>
              <select
                id="quick-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setError(null);
                }}
                className="input"
                disabled={submitting}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chip nominal cepat untuk pencatatan 3 detik */}
          <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Pilih nominal cepat">
            {QUICK_AMOUNTS.map((chip) => {
              const active = amount === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  disabled={submitting}
                  aria-pressed={active}
                  onClick={() => {
                    setAmount(chip.value);
                    setError(null);
                  }}
                  className={`min-h-9 rounded-lg border text-xs font-medium tabular-nums transition-colors ${
                    active
                      ? "border-line-strong bg-surface-3 font-semibold text-ink"
                      : "border-line bg-surface-2/60 text-ink-soft hover:border-line-strong hover:text-ink"
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-2.5 @[340px]:grid-cols-[1fr_118px]">
            <div>
              <label htmlFor="quick-desc" className="sr-only">
                Keterangan singkat
              </label>
              <input
                id="quick-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Keterangan singkat (opsional)"
                maxLength={120}
                className="input"
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="quick-method" className="sr-only">
                Metode pembayaran
              </label>
              <select
                id="quick-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="input"
                disabled={submitting}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <p role="alert" className="text-xs font-medium text-expense">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={submitting} className="btn btn-primary mt-0.5 w-full">
            {submitting ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Plus size={16} strokeWidth={2.25} aria-hidden="true" />
            )}
            {submitting ? "Menyimpan..." : type === "expense" ? "Catat Pengeluaran" : "Catat Pemasukan"}
          </button>
        </form>
      </div>
    </section>
  );
}
