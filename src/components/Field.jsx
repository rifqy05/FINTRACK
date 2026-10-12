// Label di atas input, teks bantuan opsional, pesan error di bawah input.
export default function Field({ id, label, error, hint, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-ink-soft">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-expense">
          {error}
        </p>
      ) : null}
    </div>
  );
}
