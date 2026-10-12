import { Plus } from "lucide-react";

export default function Header({ title, description, period, onPeriodChange, showPeriod, onAdd }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-soft">{description}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {showPeriod ? (
          <div className="flex items-center gap-2">
            <label htmlFor="period" className="text-sm text-ink-soft">
              Periode
            </label>
            <select
              id="period"
              value={period.type}
              onChange={(event) => onPeriodChange({ type: event.target.value })}
              className="input w-auto min-w-36"
            >
              <option value="month">Bulan ini</option>
              <option value="all">Semua data</option>
            </select>
          </div>
        ) : null}
        <button type="button" onClick={() => onAdd()} className="btn btn-primary">
          <Plus size={18} strokeWidth={2} aria-hidden="true" />
          Tambah Transaksi
        </button>
      </div>
    </header>
  );
}
