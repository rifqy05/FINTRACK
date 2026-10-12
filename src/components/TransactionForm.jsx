import { useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Modal from "./Modal.jsx";
import Field from "./Field.jsx";
import { describedBy } from "../utils/formHelpers.js";
import { MAX_DESCRIPTION_LENGTH, PAYMENT_METHODS, categoriesFor } from "../utils/constants.js";
import { todayISO } from "../utils/dates.js";
import { formatCurrency } from "../utils/formatCurrency.js";
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
  return { type: "expense", date: todayISO(), category: "", description: "", amount: "", paymentMethod: "Tunai" };
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
  const [values, setValues] = useState(() => initialValues(transaction));
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const isEditing = Boolean(transaction);

  function clearErrors(...fields) {
    setErrors((current) => {
      if (!fields.some((f) => current[f])) return current;
      const next = { ...current };
      fields.forEach((f) => delete next[f]);
      return next;
    });
  }

  function setField(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    clearErrors(field);
  }

  function changeType(type) {
    // Kategori bergantung pada jenis, jadi pilihan kategori direset.
    setValues((current) => ({ ...current, type, category: "" }));
    clearErrors("type", "category");
  }

  function handleSubmit(event) {
    event.preventDefault();
    const result = validateTransactionInput(values);
    if (!result.valid) {
      setErrors(result.errors);
      setTimeout(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    onSubmit(result.clean, transaction?.id);
  }

  const amountPreview =
    /^\d+$/.test(values.amount) && Number(values.amount) > 0 ? formatCurrency(Number(values.amount)) : null;

  return (
    <Modal title={isEditing ? "Edit Transaksi" : "Tambah Transaksi"} onClose={onCancel}>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Jenis</legend>
          <div className="grid grid-cols-2 gap-2">
            {TYPE_OPTIONS.map(({ value, label, icon: Icon, checked }) => (
              <label
                key={value}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line px-3 text-sm font-medium text-ink-soft has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[var(--focus)] ${checked}`}
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
          hint={amountPreview ? `Terbaca sebagai ${amountPreview}` : "Tulis angka saja, contoh: 35000"}
        >
          <input
            id="tx-amount"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={values.amount}
            // Hanya angka yang diterima. "Rp35.000" yang ditempel otomatis menjadi 35000.
            onChange={(e) => setField("amount", e.target.value.replace(/\D/g, ""))}
            className="input tabular-nums"
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={describedBy("tx-amount", errors.amount, true)}
            required
          />
        </Field>

        <Field id="tx-method" label="Metode pembayaran" error={errors.paymentMethod}>
          <select
            id="tx-method"
            value={values.paymentMethod}
            onChange={(e) => setField("paymentMethod", e.target.value)}
            className="input"
            aria-invalid={Boolean(errors.paymentMethod)}
            aria-describedby={describedBy("tx-method", errors.paymentMethod)}
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
          />
        </Field>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Batal
          </button>
          <button type="submit" className="btn btn-primary">
            {isEditing ? "Simpan Perubahan" : "Simpan Transaksi"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
