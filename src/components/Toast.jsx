import { useEffect } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";

// Pesan singkat sukses atau error. Hilang sendiri setelah beberapa detik.
export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onDismiss, toast.type === "error" ? 7000 : 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return <div aria-live="polite" className="sr-only" />;

  const isError = toast.type === "error";
  const Icon = isError ? CircleAlert : CircleCheck;

  return (
    <div
      aria-live={isError ? "assertive" : "polite"}
      className="pointer-events-none fixed inset-x-3 bottom-20 z-40 flex justify-center lg:bottom-6 lg:justify-end lg:pr-3"
    >
      <div
        key={toast.id}
        role={isError ? "alert" : "status"}
        className="rise-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-xl"
      >
        <Icon
          size={20}
          strokeWidth={1.75}
          aria-hidden="true"
          className={`mt-0.5 shrink-0 ${isError ? "text-expense" : "text-income"}`}
        />
        <p className="flex-1 text-sm leading-relaxed">{toast.message}</p>
        <button type="button" onClick={onDismiss} className="btn-icon -m-2 size-9" aria-label="Tutup pesan">
          <X size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
