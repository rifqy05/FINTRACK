import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompact, formatCurrency } from "../utils/formatCurrency.js";
import { shouldAnimate } from "../utils/motion.js";

const axisTick = { fill: "var(--ink-soft)", fontSize: 12 };

export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-xs shadow-lg">
      {label ? <p className="mb-1.5 font-semibold text-ink">{label}</p> : null}
      <div className="flex flex-col gap-1">
        {payload.map((item) => (
          <p key={item.dataKey ?? item.name} className="flex items-center gap-2 text-ink-soft">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: item.color ?? item.payload?.fill ?? item.fill }}
              aria-hidden="true"
            />
            <span>{item.name}</span>
            <span className="ml-auto pl-4 font-semibold text-ink tabular-nums">{formatCurrency(item.value)}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

// Tabel tersembunyi supaya pembaca layar mendapat data yang sama dengan grafik.
function ChartDataTable({ caption, columns, rows }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Periode</th>
          {columns.map((c) => (
            <th key={c.key} scope="col">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.key}>
            <th scope="row">{row.label}</th>
            {columns.map((c) => (
              <td key={c.key}>{formatCurrency(row[c.key])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function IncomeExpenseChart({ data, unit }) {
  const columns = [
    { key: "income", label: "Pemasukan" },
    { key: "expense", label: "Pengeluaran" },
  ];
  return (
    <div className="flex h-full flex-col">
      <ul className="mb-4 flex shrink-0 gap-5 text-xs text-ink-soft">
        <li className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-income" aria-hidden="true" /> Pemasukan
        </li>
        <li className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-expense" aria-hidden="true" /> Pengeluaran
        </li>
      </ul>
      <div aria-hidden="true" className="relative min-h-[17.5rem] w-full min-w-0 flex-1">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280} initialDimension={{ width: 560, height: 280 }}>
            <BarChart
              data={data}
              margin={{ top: 6, right: 6, left: 0, bottom: 0 }}
              barGap={6}
              tabIndex={-1}
              focusable="false"
            >
              <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} interval="preserveStartEnd" />
              <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} tick={axisTick} width={54} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-2)", radius: 6 }} />
              <Bar
                dataKey="income"
                name="Pemasukan"
                fill="var(--income)"
                radius={[6, 6, 2, 2]}
                maxBarSize={26}
                isAnimationActive={shouldAnimate()}
              />
              <Bar
                dataKey="expense"
                name="Pengeluaran"
                fill="var(--expense)"
                radius={[6, 6, 2, 2]}
                maxBarSize={26}
                isAnimationActive={shouldAnimate()}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <ChartDataTable caption={`Pemasukan dan pengeluaran per ${unit}`} columns={columns} rows={data} />
    </div>
  );
}

export function BalanceTrendChart({ data }) {
  const gradientId = useId().replace(/:/g, "");
  // Untuk rentang 12 bulan, tampilkan label dua-bulanan yang seragam dan berakhir tepat di bulan terakhir.
  const xTicks =
    data.length > 8 ? data.filter((_, i) => (data.length - 1 - i) % 2 === 0).map((d) => d.label) : undefined;

  return (
    <div className="flex h-full flex-col">
      <div aria-hidden="true" className="relative min-h-64 w-full min-w-0 flex-1">
        <div className="absolute inset-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={256} initialDimension={{ width: 560, height: 256 }}>
            <AreaChart data={data} margin={{ top: 10, right: 24, left: 4, bottom: 0 }} tabIndex={-1} focusable="false">
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--income)" stopOpacity={0.26} />
                  <stop offset="95%" stopColor="var(--income)" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                ticks={xTicks}
                interval={0}
                padding={{ left: 10, right: 10 }}
                tickLine={false}
                axisLine={false}
                tick={axisTick}
              />
              <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} tick={axisTick} width={54} />
              <ReferenceLine y={0} stroke="var(--line-strong)" strokeDasharray="4 4" />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="balance"
                name="Saldo"
                stroke="var(--income)"
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                dot={{ r: 3.5, fill: "var(--surface)", stroke: "var(--income)", strokeWidth: 2 }}
                activeDot={{ r: 5.5, fill: "var(--income)", stroke: "var(--surface)", strokeWidth: 2 }}
                isAnimationActive={shouldAnimate()}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <ChartDataTable
        caption="Saldo kumulatif di akhir tiap bulan"
        columns={[{ key: "balance", label: "Saldo" }]}
        rows={data}
      />
    </div>
  );
}
