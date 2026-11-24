import { CircleCheck, OctagonAlert, TriangleAlert } from "lucide-react";
import { categoryColor } from "../utils/constants.js";
import { CategoryIcon } from "./categoryIcons.js";
import { formatCurrency, formatPercent } from "../utils/formatCurrency.js";

// Status tidak hanya dibedakan warna: selalu ada ikon dan teks.
const STATUS_META = {
  ok: { label: "Normal", icon: CircleCheck, badge: "bg-income-soft text-income", bar: "bg-income" },
  warning: { label: "Hampir batas", icon: TriangleAlert, badge: "bg-warn-soft text-warn", bar: "bg-warn-bar" },
  over: { label: "Melewati batas", icon: OctagonAlert, badge: "bg-expense-soft text-expense", bar: "bg-expense" },
};

export function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className={`badge ${meta.badge}`}>
      <Icon size={13} strokeWidth={2} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

// pacePercent (opsional, 0..100): menandai posisi hari berjalan dalam bulan untuk mengukur laju belanja.
export default function BudgetProgress({
  category,
  limit,
  spent,
  remaining,
  percent,
  status,
  pacePercent = null,
  onSelectCategory,
  actions,
}) {
  const meta = STATUS_META[status];
  const showPace = typeof pacePercent === "number" && pacePercent > 2 && pacePercent < 98;
  const aheadOfPace = showPace && percent > pacePercent + 5;

  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 pt-0.5">
          <span
            aria-hidden="true"
            className="grid size-7 shrink-0 place-items-center rounded-lg border border-line bg-surface-2"
          >
            <CategoryIcon
              category={category}
              size={14}
              strokeWidth={1.85}
              style={{ color: categoryColor(category) }}
            />
          </span>
          {onSelectCategory ? (
            <button
              type="button"
              onClick={() => onSelectCategory(category)}
              title={`Lihat transaksi ${category}`}
              className="rounded-md text-left text-sm font-semibold text-ink hover:underline"
            >
              {category}
            </button>
          ) : (
            <h3 className="text-sm font-semibold">{category}</h3>
          )}
          <StatusBadge status={status} />
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      <div className="relative mt-3">
        <div
          role="progressbar"
          aria-label={`Pemakaian anggaran ${category}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.min(Math.round(percent), 100)}
          aria-valuetext={`${formatPercent(percent)} terpakai`}
          className="h-2.5 overflow-hidden rounded-full bg-surface-2"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-200 ${meta.bar}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        {showPace ? (
          <span
            aria-hidden="true"
            title={`Posisi hari ini: ${Math.round(pacePercent)}% bulan berjalan`}
            className="pointer-events-none absolute -top-0.5 -bottom-0.5 w-0.5 rounded-full bg-ink/70"
            style={{ left: `${pacePercent}%` }}
          />
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span className="tabular-nums">
          <span className="money-mask font-medium text-ink">{formatCurrency(spent)}</span> /{" "}
          <span className="money-mask">{formatCurrency(limit)}</span> ({formatPercent(percent)})
          {aheadOfPace && status === "ok" ? <span className="ml-1.5 text-warn">· lebih cepat dari kalender</span> : null}
        </span>
        <span className={`money-mask font-medium tabular-nums ${remaining < 0 ? "text-expense" : ""}`}>
          {remaining < 0 ? `Lebih ${formatCurrency(-remaining)}` : `Sisa ${formatCurrency(remaining)}`}
        </span>
      </div>
    </li>
  );
}
