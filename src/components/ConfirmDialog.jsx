import Modal from "./Modal.jsx";

export default function ConfirmDialog({ title, message, confirmLabel, danger = false, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm leading-relaxed text-ink-soft">{message}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Batal
        </button>
        <button type="button" onClick={onConfirm} className={danger ? "btn btn-danger" : "btn btn-primary"}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
