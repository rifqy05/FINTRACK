import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

// Dialog bawaan browser (<dialog>): fokus terkunci di dalam dialog dan Esc menutupnya.
// useId memberi id unik per instance supaya dua dialog tidak berbagi id yang sama.
export default function Modal({ title, onClose, onRequestClose, children }) {
  const ref = useRef(null);
  const titleId = useId();
  const handleCloseRequest = onRequestClose ?? onClose;

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        handleCloseRequest();
      }}
      onClick={(event) => {
        if (event.target === ref.current) handleCloseRequest();
      }}
      className="rise-in m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-ink shadow-xl backdrop:bg-slate-950/60"
    >
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={handleCloseRequest}
            className="btn-icon -mt-2 -mr-2"
            aria-label="Tutup dialog"
          >
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
