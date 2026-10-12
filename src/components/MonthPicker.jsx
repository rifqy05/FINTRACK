import { currentMonthKey, makeMonthKey, monthName } from "../utils/dates.js";

// Pilih bulan dan tahun dengan dua <select>. Lebih konsisten di semua browser daripada <input type="month">.
export default function MonthPicker({ idPrefix, value, onChange, extraYears = [] }) {
  const [yearText, monthText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  const thisYear = Number(currentMonthKey().slice(0, 4));
  const years = [...new Set([thisYear - 2, thisYear - 1, thisYear, thisYear + 1, year, ...extraYears])].sort(
    (a, b) => a - b,
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <label htmlFor={`${idPrefix}-month`} className="text-sm font-medium">
          Bulan
        </label>
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
