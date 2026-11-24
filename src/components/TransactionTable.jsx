import { ArrowDownRight, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { TYPE_LABELS, categoryColor } from "../utils/constants.js";
import { CategoryIcon } from "./categoryIcons.js";
import { formatDate } from "../utils/dates.js";
import { formatCurrency } from "../utils/formatCurrency.js";

// Buku kas modern: ikon kategori bernuansa di tiap baris, angka tabular kanan, dan kartu ringkas di ponsel.
function Amount({ transaction }) {
  const income = transaction.type === "income";
  const Icon = income ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`money-mask inline-flex items-center gap-1 font-semibold tabular-nums ${income ? "text-income" : "text-expense"}`}
    >
      <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
      <span className="sr-only">{TYPE_LABELS[transaction.type]} </span>
      {income ? "+" : "-"}
      {formatCurrency(transaction.amount)}
    </span>
  );
}

function CategoryEmblem({ transaction }) {
  const isIncome = transaction.type === "income";
  return (
    <span
      aria-hidden="true"
      className={`grid size-9 shrink-0 place-items-center rounded-xl border ${
        isIncome ? "border-income/20 bg-income-soft text-income" : "border-line bg-surface-2 text-ink"
      }`}
    >
      <CategoryIcon
        category={transaction.category}
        size={16}
        strokeWidth={1.8}
        style={isIncome ? undefined : { color: categoryColor(transaction.category) }}
      />
    </span>
  );
}

function RowActions({ transaction, onEdit, onDelete }) {
  const name = transaction.description || transaction.category;
  return (
    <div className="flex items-center justify-end gap-0.5">
      <button
        type="button"
        onClick={() => onEdit(transaction)}
        className="btn-icon"
        aria-label={`Edit transaksi ${name}`}
        title="Edit"
      >
        <Pencil size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onDelete(transaction)}
        className="btn-icon hover:bg-expense-soft hover:text-expense"
        aria-label={`Hapus transaksi ${name}`}
        title="Hapus"
      >
        <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
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
            <tr className="border-b border-line text-left text-xs text-ink-soft">
              <th scope="col" className="pb-3 pr-4 font-medium">
                Transaksi
              </th>
              <th scope="col" className="pb-3 pr-4 font-medium">
                Kategori
              </th>
              <th scope="col" className="pb-3 pr-4 font-medium">
                Metode
              </th>
              <th scope="col" className="pb-3 pr-4 font-medium">
                Tanggal
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
              <tr key={t.id} className="transition-colors duration-150 hover:bg-surface-2/60">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <CategoryEmblem transaction={t} />
                    <span className="max-w-72 font-medium text-ink [overflow-wrap:anywhere]">
                      {t.description || <span className="font-normal text-ink-soft">{t.category}</span>}
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span className="badge border-line bg-surface-2 text-ink">{t.category}</span>
                </td>
                <td className="py-3 pr-4 text-ink-soft">{t.paymentMethod}</td>
                <td className="py-3 pr-4 whitespace-nowrap text-ink-soft tabular-nums">{formatDate(t.date)}</td>
                <td className="py-3 text-right whitespace-nowrap">
                  <Amount transaction={t} />
                </td>
                {editable ? (
                  <td className="py-1.5 pl-2">
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
          <li key={t.id} className="py-3.5 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
              <CategoryEmblem transaction={t} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-sm font-medium text-ink [overflow-wrap:anywhere]">
                    {t.description || <span className="text-ink-soft">{t.category}</span>}
                  </p>
                  <div className="shrink-0 text-sm">
                    <Amount transaction={t} />
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-ink-soft">
                  <span className="tabular-nums">{formatDate(t.date)}</span>
                  <span className="badge border-line bg-surface-2 text-ink">{t.category}</span>
                  <span>{t.paymentMethod}</span>
                </div>
                {editable ? (
                  <div className="mt-1 -mr-2">
                    <RowActions transaction={t} onEdit={onEdit} onDelete={onDelete} />
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
