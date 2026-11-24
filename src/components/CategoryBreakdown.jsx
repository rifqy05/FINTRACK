import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { categoryColor } from "../utils/constants.js";
import { CategoryIcon } from "./categoryIcons.js";
import { formatCurrency, formatPercent } from "../utils/formatCurrency.js";
import { shouldAnimate } from "../utils/motion.js";
import { ChartTooltip } from "./Charts.jsx";

// Doughnut + daftar peringkat kategori dengan bar proporsi mineral & drill-down klik kategori.
export default function CategoryBreakdown({ data, total, onSelectCategory }) {
  return (
    <div className="@container">
      <div className="flex flex-col items-center gap-4 @lg:flex-row @lg:items-center @lg:gap-6">
        <div className="relative size-40 shrink-0" aria-hidden="true">
          <PieChart width={160} height={160} tabIndex={-1} focusable="false">
            <Pie
              data={data}
              dataKey="amount"
              nameKey="category"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={data.length > 1 ? 2.5 : 0}
              stroke="var(--surface)"
              strokeWidth={2}
              isAnimationActive={shouldAnimate()}
              onClick={onSelectCategory ? (entry) => entry?.category && onSelectCategory(entry.category) : undefined}
              className={onSelectCategory ? "cursor-pointer" : undefined}
            >
              {data.map((row) => (
                <Cell key={row.category} fill={categoryColor(row.category)} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
            <span className="text-xs text-ink-soft">Total</span>
            <span className="money-mask max-w-24 text-sm font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere]">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <ul className="w-full min-w-0 flex-1 space-y-1.5">
          {data.map((row) => {
            const color = categoryColor(row.category);
            const content = (
              <>
                <div className="flex items-center gap-2.5 text-sm">
                  <span
                    className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink"
                    aria-hidden="true"
                  >
                    <CategoryIcon category={row.category} size={14} strokeWidth={1.85} style={{ color }} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-left font-medium">{row.category}</span>
                  <span className="shrink-0 text-xs text-ink-soft tabular-nums">
                    {formatPercent(row.percent, 0)}
                  </span>
                  <span className="money-mask w-28 shrink-0 text-right font-semibold tabular-nums">
                    {formatCurrency(row.amount)}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                  <div
                    className="h-full rounded-full transition-[width] duration-200"
                    style={{ width: `${Math.max(row.percent, 2)}%`, background: color }}
                  />
                </div>
              </>
            );

            return (
              <li key={row.category}>
                {onSelectCategory ? (
                  <button
                    type="button"
                    onClick={() => onSelectCategory(row.category)}
                    title={`Lihat semua transaksi kategori ${row.category}`}
                    className="flex w-full flex-col gap-1.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-surface-2/80"
                  >
                    {content}
                  </button>
                ) : (
                  <div className="flex flex-col gap-1.5 py-1">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
