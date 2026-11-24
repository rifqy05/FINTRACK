import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, RotateCcw, X } from "lucide-react";

// Pesan singkat sukses atau error, mendukung tombol aksi cepat (mis. "Urungkan" saat hapus transaksi).
export default function Toast({ toast, onDismiss }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!toast || paused) return undefined;
    const duration = toast.type === "error" ? 7000 : toast.action ? 6000 : 4000;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [toast, paused, onDismiss]);

  if (!toast) return <div aria-live="polite" className="sr-only" />;

  const isError = toast.type === "error";
  const Icon = isError ? CircleAlert : CircleCheck;

  return (
    <div
      aria-live={isError ? "assertive" : "polite"}
      className="pointer-events-none fixed inset-x-3 bottom-36 z-40 flex justify-center lg:bottom-6 lg:justify-end lg:pr-3"
    >
      <div
        key={toast.id}
        role={isError ? "alert" : "status"}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className="rise-in pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 pl-4 shadow-xl"
      >
        <Icon
          size={19}
          strokeWidth={1.85}
          aria-hidden="true"
          className={`shrink-0 ${isError ? "text-expense" : "text-income"}`}
        />
        <p className="min-w-0 flex-1 text-sm leading-snug text-pretty">{toast.message}</p>
        {toast.action ? (
          <button
            type="button"
            onClick={() => {
              const fn = toast.action.onClick;
              onDismiss();
              fn();
            }}
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-line-strong bg-surface-2 px-3 text-xs font-semibold text-ink transition-colors hover:bg-surface-3"
          >
            <RotateCcw size={13} strokeWidth={2} aria-hidden="true" />
            {toast.action.label}
          </button>
        ) : null}
        <button type="button" onClick={onDismiss} className="btn-icon -mr-1.5 shrink-0" aria-label="Tutup pesan">
          <X size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
