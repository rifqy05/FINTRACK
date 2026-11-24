import { useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Loader2 } from "lucide-react";
import Modal from "./Modal.jsx";
import Field from "./Field.jsx";
import { describedBy } from "../utils/formHelpers.js";
import { MAX_DESCRIPTION_LENGTH, PAYMENT_METHODS, categoriesFor } from "../utils/constants.js";
import { todayISO } from "../utils/dates.js";
import { formatCurrency, formatDigitsInput } from "../utils/formatCurrency.js";
import { loadLastPaymentMethod, saveLastPaymentMethod } from "../utils/storage.js";
import { validateTransactionInput } from "../utils/validation.js";

function initialValues(transaction) {
  if (transaction) {
    return {
      type: transaction.type,
      date: transaction.date,
      category: transaction.category,
      description: transaction.description,
      amount: String(transaction.amount),
      paymentMethod: transaction.paymentMethod,
    };
  }
  return {
    type: "expense",
    date: todayISO(),
    category: "",
    description: "",
    amount: "",
    paymentMethod: loadLastPaymentMethod(),
  };
}

const TYPE_OPTIONS = [
  {
    value: "expense",
    label: "Pengeluaran",
    icon: ArrowDownRight,
    checked: "has-checked:border-expense has-checked:bg-expense-soft has-checked:text-expense",
  },
  {
    value: "income",
    label: "Pemasukan",
    icon: ArrowUpRight,
    checked: "has-checked:border-income has-checked:bg-income-soft has-checked:text-income",
  },
];

// Form tambah dan edit transaksi (dialog). transaction = null berarti transaksi baru.
export default function TransactionForm({ transaction, onSubmit, onCancel }) {
  const [baseline] = useState(() => initialValues(transaction));
  const [values, setValues] = useState(baseline);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const formRef = useRef(null);
  const amountRef = useRef(null);
  const isEditing = Boolean(transaction);

  const isDirty =
    values.type !== baseline.type ||
    values.date !== baseline.date ||
    values.category !== baseline.category ||
    values.description !== baseline.description ||
    values.amount !== baseline.amount ||
    values.paymentMethod !== baseline.paymentMethod;

  function clearErrors(...fields) {
    setErrors((current) => {
      if (!fields.some((f) => current[f])) return current;
      const next = { ...current };
      fields.forEach((f) => delete next[f]);
      return next;
    });
  }

  function setField(field, value) {
    setConfirmDiscard(false);
    setValues((current) => ({ ...current, [field]: value }));
    clearErrors(field);
  }

  function changeType(type) {
    setConfirmDiscard(false);
    // Kategori bergantung pada jenis, jadi pilihan kategori direset.
    setValues((current) => ({ ...current, type, category: "" }));
    clearErrors("type", "category");
  }

  function requestClose() {
    if (submitting) return;
    if (isDirty && !confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    onCancel();
  }

  async function submitFlow(keepOpen = false) {
    if (submitting) return;
    const result = validateTransactionInput(values);
    if (!result.valid) {
      setErrors(result.errors);
      setTimeout(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }

    setSubmitting(true);
    setConfirmDiscard(false);
    try {
      const saved = await onSubmit(result.clean, transaction?.id, { keepOpen });
      if (saved !== false) {
        saveLastPaymentMethod(result.clean.paymentMethod);
        if (keepOpen && !isEditing) {
          setValues((current) => ({
            ...current,
            amount: "",
            description: "",
          }));
          setErrors({});
          setTimeout(() => amountRef.current?.focus(), 0);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submitFlow(false);
  }

  const amountPreview =
    /^\d+$/.test(values.amount) && Number(values.amount) > 0 ? formatCurrency(Number(values.amount)) : null;

  return (
    <Modal title={isEditing ? "Edit Transaksi" : "Tambah Transaksi"} onClose={onCancel} onRequestClose={requestClose}>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {confirmDiscard ? (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-warn/30 bg-warn-soft p-3 text-xs text-warn"
          >
            <span className="font-medium">Perubahan belum disimpan. Tutup formulir ini?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDiscard(false)}
                className="inline-flex min-h-9 items-center rounded-lg border border-line bg-surface px-2.5 font-medium text-ink hover:bg-surface-2"
              >
                Tetap edit
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex min-h-9 items-center rounded-lg bg-expense px-2.5 font-medium text-expense-ink hover:bg-expense/90"
              >
                Buang perubahan
              </button>
            </div>
          </div>
        ) : null}

        <fieldset className="flex flex-col gap-2" disabled={submitting}>
          <legend className="mb-2 text-sm font-medium">Jenis</legend>
          <div className="grid grid-cols-2 gap-2">
            {TYPE_OPTIONS.map(({ value, label, icon: Icon, checked }) => (
              <label
                key={value}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[var(--focus)] ${checked}`}
              >
                <input
                  type="radio"
                  name="type"
                  value={value}
                  checked={values.type === value}
                  onChange={() => changeType(value)}
                  className="sr-only"
                />
                <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                {label}
              </label>
            ))}
          </div>
          {errors.type ? (
            <p role="alert" className="text-sm font-medium text-expense">
              {errors.type}
            </p>
          ) : null}
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="tx-date" label="Tanggal" error={errors.date}>
            <input
              id="tx-date"
              type="date"
              value={values.date}
              onChange={(e) => setField("date", e.target.value)}
              className="input"
              aria-invalid={Boolean(errors.date)}
              aria-describedby={describedBy("tx-date", errors.date)}
              disabled={submitting}
              required
            />
          </Field>

          <Field id="tx-category" label="Kategori" error={errors.category}>
            <select
              id="tx-category"
              value={values.category}
              onChange={(e) => setField("category", e.target.value)}
              className="input"
              aria-invalid={Boolean(errors.category)}
              aria-describedby={describedBy("tx-category", errors.category)}
              disabled={submitting}
              required
            >
              <option value="">Pilih kategori</option>
              {categoriesFor(values.type).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          id="tx-amount"
          label="Nominal (Rupiah)"
          error={errors.amount}
          hint={amountPreview ? `Terbaca sebagai ${amountPreview}` : "Tulis angka saja, contoh: 35.000"}
        >
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-ink-soft"
            >
              Rp
            </span>
            <input
              id="tx-amount"
              ref={amountRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={formatDigitsInput(values.amount)}
              // Hanya angka yang disimpan; tampilannya diberi pemisah ribuan otomatis.
              onChange={(e) => setField("amount", e.target.value.replace(/\D/g, ""))}
              placeholder="35.000"
              className="input pl-10 tabular-nums"
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={describedBy("tx-amount", errors.amount, true)}
              disabled={submitting}
              required
            />
          </div>
        </Field>

        <Field id="tx-method" label="Metode pembayaran" error={errors.paymentMethod}>
          <select
            id="tx-method"
            value={values.paymentMethod}
            onChange={(e) => setField("paymentMethod", e.target.value)}
            className="input"
            aria-invalid={Boolean(errors.paymentMethod)}
            aria-describedby={describedBy("tx-method", errors.paymentMethod)}
            disabled={submitting}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id="tx-description"
          label="Keterangan (opsional)"
          error={errors.description}
          hint={`${values.description.length} dari ${MAX_DESCRIPTION_LENGTH} karakter`}
        >
          <input
            id="tx-description"
            type="text"
            value={values.description}
            onChange={(e) => setField("description", e.target.value)}
            className="input"
            placeholder="Contoh: makan siang"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={describedBy("tx-description", errors.description, true)}
            disabled={submitting}
          />
        </Field>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button type="button" onClick={requestClose} disabled={submitting} className="btn btn-secondary">
            Batal
          </button>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => submitFlow(true)}
              disabled={submitting}
              className="btn btn-secondary"
            >
              Simpan & tambah lagi
            </button>
          ) : null}
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : null}
            {submitting ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Simpan Transaksi"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
