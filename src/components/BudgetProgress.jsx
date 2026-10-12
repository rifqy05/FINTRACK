import { CircleCheck, OctagonAlert, TriangleAlert } from "lucide-react";
import { formatCurrency, formatPercent } from "../utils/formatCurrency.js";

// Status tidak hanya dibedakan warna: selalu ada ikon dan teks.
const STATUS_META = {
  ok: { label: "Normal", icon: CircleCheck, badge: "bg-income-soft text-income", bar: "bg-income" },
  warning: { label: "Hampir mencapai batas", icon: TriangleAlert, badge: "bg-warn-soft text-warn", bar: "bg-warn-bar" },
  over: { label: "Melewati batas", icon: OctagonAlert, badge: "bg-expense-soft text-expense", bar: "bg-expense" },
};

export function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className={`badge ${meta.badge}`}>
      <Icon size={14} strokeWidth={2} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export default function BudgetProgress({ category, limit, spent, remaining, percent, status, actions }) {
  const meta = STATUS_META[status];
  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{category}</h3>
          <StatusBadge status={status} />
        </div>
        {actions}
      </div>

      <div
        role="progressbar"
        aria-label={`Pemakaian anggaran ${category}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(Math.round(percent), 100)}
        aria-valuetext={`${formatPercent(percent)} terpakai`}
        className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2"
      >
        <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>

      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span className="tabular-nums">
          {formatCurrency(spent)} dari {formatCurrency(limit)} ({formatPercent(percent)})
        </span>
        <span className={`font-medium tabular-nums ${remaining < 0 ? "text-expense" : ""}`}>
          {remaining < 0 ? `Lebih ${formatCurrency(-remaining)}` : `Sisa ${formatCurrency(remaining)}`}
        </span>
      </div>
    </li>
  );
}
