import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, currentMonthKey, makeMonthKey, monthName } from "../utils/dates.js";

// Pilih bulan dan tahun dengan tombol langkah + dua <select> (konsisten di semua browser).
export default function MonthPicker({ idPrefix, value, onChange, extraYears = [] }) {
  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  const thisYear = Number(currentMonthKey().slice(0, 4));
  const years = [...new Set([thisYear - 2, thisYear - 1, thisYear, thisYear + 1, year, ...extraYears])].sort(
    (a, b) => a - b,
  );

  return (
    <div className="flex flex-wrap items-end gap-2 sm:gap-3">
      <div className="flex flex-col gap-2">
        <label htmlFor={`${idPrefix}-month`} className="text-sm font-medium">
          Bulan
        </label>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange(addMonths(value, -1))}
            className="btn-icon border border-line bg-surface"
            aria-label="Bulan sebelumnya"
            title="Bulan sebelumnya"
          >
            <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <select
            id={`${idPrefix}-month`}
            value={month}
            onChange={(event) => onChange(makeMonthKey(year, Number(event.target.value)))}
            className="input w-auto min-w-36"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {monthName(m)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onChange(addMonths(value, 1))}
            className="btn-icon border border-line bg-surface"
            aria-label="Bulan berikutnya"
            title="Bulan berikutnya"
          >
            <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${idPrefix}-year`} className="text-sm font-medium">
          Tahun
        </label>
        <select
          id={`${idPrefix}-year`}
          value={year}
          onChange={(event) => onChange(makeMonthKey(Number(event.target.value), month))}
          className="input w-auto min-w-28"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
