import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { categoryColor } from "../utils/constants.js";
import { formatCurrency, formatPercent } from "../utils/formatCurrency.js";
import { shouldAnimate } from "../utils/motion.js";
import { ChartTooltip } from "./Charts.jsx";

// Doughnut pengeluaran per kategori. Legenda berisi nama, persen, dan nominal,
// jadi informasi tidak hanya bergantung pada warna.
export default function CategoryBreakdown({ data, total }) {
  return (
    <div className="@container">
      <div className="flex flex-col items-center gap-6 @xl:flex-row">
        <div className="relative size-48 shrink-0" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="category"
                innerRadius="62%"
                outerRadius="100%"
                paddingAngle={data.length > 1 ? 2 : 0}
                stroke="var(--surface)"
                strokeWidth={2}
                isAnimationActive={shouldAnimate()}
              >
                {data.map((row) => (
                  <Cell key={row.category} fill={categoryColor(row.category)} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xs text-ink-soft">Total</span>
            <span className="max-w-28 text-sm font-semibold tabular-nums [overflow-wrap:anywhere]">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <ul className="w-full min-w-0 flex-1 space-y-2.5">
          {data.map((row) => (
            <li key={row.category} className="flex items-center gap-3 text-sm">
              <span
                className="size-3 shrink-0 rounded-sm"
                style={{ background: categoryColor(row.category) }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate">{row.category}</span>
              <span className="w-12 shrink-0 text-right text-ink-soft tabular-nums">
                {formatPercent(row.percent, 0)}
              </span>
              <span className="w-28 shrink-0 text-right font-medium tabular-nums">{formatCurrency(row.amount)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
