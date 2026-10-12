import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-card">
      {label ? <p className="mb-1 font-medium text-ink">{label}</p> : null}
      {payload.map((item) => (
        <p key={item.dataKey ?? item.name} className="flex items-center gap-2 text-ink-soft">
          <span
            className="size-2 rounded-sm"
            style={{ background: item.color ?? item.payload?.fill ?? item.fill }}
            aria-hidden="true"
          />
          <span>{item.name}</span>
          <span className="ml-auto pl-3 font-medium text-ink tabular-nums">{formatCurrency(item.value)}</span>
        </p>
      ))}
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
    <div>
      <ul className="mb-3 flex gap-4 text-xs text-ink-soft">
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-income" aria-hidden="true" /> Pemasukan
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-expense" aria-hidden="true" /> Pengeluaran
        </li>
      </ul>
      <div aria-hidden="true" className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={4}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} interval="preserveStartEnd" />
            <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} tick={axisTick} width={52} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-2)" }} />
            <Bar
              dataKey="income"
              name="Pemasukan"
              fill="var(--income)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
              isAnimationActive={shouldAnimate()}
            />
            <Bar
              dataKey="expense"
              name="Pengeluaran"
              fill="var(--expense)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
              isAnimationActive={shouldAnimate()}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartDataTable caption={`Pemasukan dan pengeluaran per ${unit}`} columns={columns} rows={data} />
    </div>
  );
}

export function BalanceTrendChart({ data }) {
  return (
    <div>
      <div aria-hidden="true" className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} interval="preserveStartEnd" />
            <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} tick={axisTick} width={52} />
            <ReferenceLine y={0} stroke="var(--ink-soft)" strokeDasharray="4 4" />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="balance"
              name="Saldo"
              stroke="var(--cat-2)"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "var(--surface)", stroke: "var(--cat-2)", strokeWidth: 2 }}
              activeDot={{ r: 5 }}
              isAnimationActive={shouldAnimate()}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ChartDataTable
        caption="Saldo kumulatif di akhir tiap bulan"
        columns={[{ key: "balance", label: "Saldo" }]}
        rows={data}
      />
    </div>
  );
}
