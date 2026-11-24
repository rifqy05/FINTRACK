export default function EmptyState({
  icon: Icon,
  title,
  description,
  headingAs = "h2",
  boxed = true,
  children,
}) {
  const Heading = headingAs;
  const containerClass = boxed
    ? "flex flex-col items-start gap-3 rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-10 sm:items-center sm:text-center"
    : "flex flex-col items-start gap-3 py-8 sm:items-center sm:text-center";

  return (
    <div className={containerClass}>
      {Icon ? <Icon size={26} strokeWidth={1.6} aria-hidden="true" className="text-ink-soft" /> : null}
      <div className="max-w-md">
        <Heading className="text-base font-semibold tracking-tight text-ink">{title}</Heading>
        {description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft text-pretty">{description}</p>
        ) : null}
      </div>
      {children ? <div className="mt-1 flex flex-wrap gap-2 sm:justify-center">{children}</div> : null}
    </div>
  );
}
