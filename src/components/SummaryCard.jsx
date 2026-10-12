// Kartu ringkasan. tone: "hero" (kartu utama), "income", "expense", atau "neutral".
const TONES = {
  hero: {
    card: "border-transparent bg-hero text-hero-ink",
    label: "text-hero-soft",
    icon: "bg-white/10 text-hero-ink",
    hint: "text-hero-soft",
  },
  income: {
    card: "border-line bg-surface",
    label: "text-ink-soft",
    icon: "bg-income-soft text-income",
    hint: "text-ink-soft",
  },
  expense: {
    card: "border-line bg-surface",
    label: "text-ink-soft",
    icon: "bg-expense-soft text-expense",
    hint: "text-ink-soft",
  },
  neutral: {
    card: "border-line bg-surface",
    label: "text-ink-soft",
    icon: "bg-brand-soft text-brand",
    hint: "text-ink-soft",
  },
};

export default function SummaryCard({ label, value, hint, icon: Icon, tone = "neutral", className = "" }) {
  const t = TONES[tone];
  return (
    <section className={`rounded-2xl border p-4 shadow-card sm:p-5 ${t.card} ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={`text-sm font-medium ${t.label}`}>{label}</h2>
        {Icon ? (
          <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${t.icon}`}>
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-[clamp(1.125rem,5vw,1.625rem)] font-semibold tracking-tight tabular-nums [overflow-wrap:anywhere]">
        {value}
      </p>
      {hint ? <p className={`mt-1 text-xs ${t.hint}`}>{hint}</p> : null}
    </section>
  );
}
