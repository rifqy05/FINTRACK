import { Cloud, CloudOff, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { describeSync } from "../utils/syncState.js";

const ICONS = {
  local: CloudOff,
  offline: WifiOff,
  saving: Loader2,
  saved: Cloud,
  error: CloudOff,
};

const TONES = {
  neutral: "border-line bg-surface-2 text-ink-soft",
  warn: "border-warn/30 bg-warn-soft text-warn",
  busy: "border-line-strong bg-surface-2 text-ink",
  ok: "border-line-strong bg-surface-2 text-ink",
  bad: "border-expense/25 bg-expense-soft text-expense",
};

const DETAIL_TONES = { bad: "text-expense", warn: "text-warn" };

export default function SyncStatus({
  status = "local",
  lastSavedAt = null,
  error = null,
  onRetry,
  showDetail = false,
  announce = true,
  className = "",
}) {
  const { label, tone, detail, time, retryable } = describeSync(status, { lastSavedAt, error });
  const Icon = ICONS[status] ?? CloudOff;

  return (
    <div className={`flex flex-col items-start gap-1.5 ${className}`}>
      <span
        role={announce ? "status" : undefined}
        aria-live={announce ? "polite" : undefined}
        className={`badge self-start ${TONES[tone]}`}
      >
        <Icon size={13} strokeWidth={1.75} className={status === "saving" ? "animate-spin" : ""} aria-hidden="true" />
        {label}
        {status === "saved" && time ? <span className="font-normal opacity-80">· {time}</span> : null}
      </span>

      {showDetail && detail ? (
        <div
          className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-relaxed text-pretty ${
            DETAIL_TONES[tone] ?? "text-ink-soft"
          }`}
        >
          <span>{detail}</span>
          {retryable && onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 font-medium text-ink transition-colors hover:bg-surface-2"
            >
              <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
              Coba lagi
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
