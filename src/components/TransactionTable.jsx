import { ArrowDownRight, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { TYPE_LABELS } from "../utils/constants.js";
import { formatDate } from "../utils/dates.js";
import { formatCurrency } from "../utils/formatCurrency.js";

// Tabel di layar lebar, daftar bertumpuk di ponsel (tanpa scroll horizontal).
// Tombol edit dan hapus hanya muncul jika onEdit dan onDelete diberikan.
function Amount({ transaction }) {
  const income = transaction.type === "income";
  const Icon = income ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium tabular-nums ${income ? "text-income" : "text-expense"}`}
    >
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
      <span className="sr-only">{TYPE_LABELS[transaction.type]} </span>
      {income ? "+" : "-"}
      {formatCurrency(transaction.amount)}
    </span>
  );
}

function RowActions({ transaction, onEdit, onDelete }) {
  const name = transaction.description || transaction.category;
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => onEdit(transaction)}
        className="btn-icon"
        aria-label={`Edit transaksi ${name}`}
        title="Edit"
      >
        <Pencil size={18} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(transaction)}
        className="btn-icon hover:bg-expense-soft hover:text-expense"
        aria-label={`Hapus transaksi ${name}`}
        title="Hapus"
      >
        <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
}

export default function TransactionTable({ transactions, onEdit, onDelete }) {
  const editable = Boolean(onEdit && onDelete);

  return (
    <>
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Daftar transaksi, terbaru di atas</caption>
          <thead>
            <tr className="text-left text-xs text-ink-soft">
              <th scope="col" className="pb-3 pr-4 font-medium">
                Tanggal
              </th>
              <th scope="col" className="pb-3 pr-4 font-medium">
                Keterangan
              </th>
              <th scope="col" className="pb-3 pr-4 font-medium">
                Kategori
              </th>
              <th scope="col" className="pb-3 pr-4 font-medium">
                Metode
              </th>
              <th scope="col" className="pb-3 text-right font-medium">
                Jumlah
              </th>
              {editable ? (
                <th scope="col" className="pb-3 pl-2 text-right font-medium">
                  <span className="sr-only">Aksi</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {transactions.map((t) => (
              <tr key={t.id}>
                <td className="py-3 pr-4 whitespace-nowrap text-ink-soft">{formatDate(t.date)}</td>
                <td className="max-w-64 py-3 pr-4 [overflow-wrap:anywhere]">
                  {t.description || <span className="text-ink-soft">Tanpa keterangan</span>}
                </td>
                <td className="py-3 pr-4">
                  <span className="badge bg-surface-2 text-ink">{t.category}</span>
                </td>
                <td className="py-3 pr-4 text-ink-soft">{t.paymentMethod}</td>
                <td className="py-3 text-right whitespace-nowrap">
                  <Amount transaction={t} />
                </td>
                {editable ? (
                  <td className="py-1 pl-2">
                    <RowActions transaction={t} onEdit={onEdit} onDelete={onDelete} />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-line md:hidden">
        {transactions.map((t) => (
          <li key={t.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-sm font-medium [overflow-wrap:anywhere]">
                {t.description || <span className="text-ink-soft">Tanpa keterangan</span>}
              </p>
              <div className="shrink-0 text-sm">
                <Amount transaction={t} />
              </div>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
              <span>{formatDate(t.date)}</span>
              <span className="badge bg-surface-2 text-ink">{t.category}</span>
              <span>{t.paymentMethod}</span>
            </div>
            {editable ? (
              <div className="mt-1 -mr-2">
                <RowActions transaction={t} onEdit={onEdit} onDelete={onDelete} />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
