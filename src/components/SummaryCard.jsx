// Kartu ringkasan. tone: "hero" (kartu utama), "income", "expense", atau "neutral".
const TONES = {
  hero: {
    card: "hero-deck",
    label: "text-hero-soft",
    icon: "bg-hero-surface text-hero-ink ring-1 ring-hero-line",
    hint: "text-hero-soft",
    value: "text-2xl sm:text-[1.75rem]",
  },
  income: {
    card: "border-line bg-surface",
    label: "text-ink-soft",
    icon: "bg-income-soft text-income",
    hint: "text-ink-soft",
    value: "text-lg sm:text-xl",
  },
  expense: {
    card: "border-line bg-surface",
    label: "text-ink-soft",
    icon: "bg-expense-soft text-expense",
    hint: "text-ink-soft",
    value: "text-lg sm:text-xl",
  },
  neutral: {
    card: "border-line bg-surface",
    label: "text-ink-soft",
    icon: "bg-surface-2 text-ink",
    hint: "text-ink-soft",
    value: "text-lg sm:text-xl",
  },
};

export default function SummaryCard({ label, value, hint, icon: Icon, tone = "neutral", className = "" }) {
  const t = TONES[tone];
  return (
    <section className={`rounded-2xl border p-4 sm:p-5 ${t.card} ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={`text-sm font-medium ${t.label}`}>{label}</h2>
        {Icon ? (
          <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${t.icon}`}>
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className={`mt-3 leading-tight font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere] ${t.value}`}>
        {value}
      </p>
      {hint ? <p className={`mt-1.5 text-xs leading-relaxed text-pretty ${t.hint}`}>{hint}</p> : null}
    </section>
  );
}
