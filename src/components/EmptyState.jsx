export default function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-line px-6 py-10 sm:items-center sm:text-center">
      {Icon ? (
        <span className="grid size-11 place-items-center rounded-lg bg-brand-soft text-brand">
          <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
        </span>
      ) : null}
      <div className="max-w-md">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        {description ? <p className="mt-1 text-sm leading-relaxed text-ink-soft">{description}</p> : null}
      </div>
      {children ? <div className="mt-1 flex flex-wrap gap-2 sm:justify-center">{children}</div> : null}
    </div>
  );
}
