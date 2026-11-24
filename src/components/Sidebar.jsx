import { LogIn, LogOut, Wallet } from "lucide-react";
import { NAV_ITEMS, PRIMARY_NAV_ITEMS } from "./navItems.js";

// Desktop: rail obsidian permanen di kiri (baik tema terang maupun gelap).
// Ponsel & tablet: 5 menu utama di bawah layar (Pengaturan di bilah atas).
export default function Sidebar({ current, onNavigate, user = null, onOpenAuth, onSignOut }) {
  const mainItems = NAV_ITEMS.filter((item) => item.primary);
  const utilityItems = NAV_ITEMS.filter((item) => !item.primary);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-rail-line bg-rail px-4 py-6 text-rail-ink lg:flex xl:w-64">
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-rail-active text-rail-ink ring-1 ring-rail-line">
              <Wallet size={19} strokeWidth={1.85} aria-hidden="true" />
            </span>
            <div className="flex flex-col">
              <span className="text-base leading-tight font-semibold tracking-tight text-rail-ink">FinTrack</span>
              <span className="text-xs leading-tight text-rail-soft">Keuangan pribadi</span>
            </div>
          </div>
        </div>

        <nav aria-label="Menu utama" className="mt-8 flex flex-col gap-1">
          {mainItems.map(({ id, label, icon: Icon }) => {
            const active = current === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                aria-current={active ? "page" : undefined}
                className={`group flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm font-medium transition-colors duration-150 ${
                  active
                    ? "border-rail-line bg-rail-active text-rail-ink"
                    : "border-transparent text-rail-soft hover:bg-rail-surface hover:text-rail-ink"
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2 : 1.75}
                  aria-hidden="true"
                  className={active ? "text-rail-ink" : "text-rail-soft group-hover:text-rail-ink"}
                />
                {label}
              </button>
            );
          })}

          <div className="my-3 border-t border-rail-line" aria-hidden="true" />

          {utilityItems.map(({ id, label, icon: Icon }) => {
            const active = current === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                aria-current={active ? "page" : undefined}
                className={`group flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm font-medium transition-colors duration-150 ${
                  active
                    ? "border-rail-line bg-rail-active text-rail-ink"
                    : "border-transparent text-rail-soft hover:bg-rail-surface hover:text-rail-ink"
                }`}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2 : 1.75}
                  aria-hidden="true"
                  className={active ? "text-rail-ink" : "text-rail-soft group-hover:text-rail-ink"}
                />
                {label}
              </button>
            );
          })}
        </nav>

        {user ? (
          <div className="mt-auto flex flex-col gap-2 rounded-xl border border-rail-line bg-rail-surface p-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="size-2 shrink-0 rounded-full bg-rail-ink" aria-hidden="true" />
              <span className="truncate font-medium text-rail-ink" title={user.email}>
                {user.email}
              </span>
            </div>
            <p className="text-xs text-rail-soft">Sinkronisasi cloud aktif</p>
            <button
              type="button"
              onClick={onSignOut}
              className="mt-1 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-rail-line bg-rail px-3 text-xs font-medium text-rail-ink transition-colors hover:border-expense/40 hover:bg-expense-soft/20 hover:text-expense"
            >
              <LogOut size={15} strokeWidth={1.75} aria-hidden="true" />
              Keluar
            </button>
          </div>
        ) : (
          <div className="mt-auto flex flex-col gap-2.5 rounded-xl border border-rail-line bg-rail-surface p-3">
            <p className="text-xs leading-relaxed text-rail-soft text-pretty">
              Mode lokal di perangkat ini. Masuk agar catatan tersinkron lintas perangkat.
            </p>
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-rail-ink px-3 text-xs font-medium text-rail transition-colors hover:bg-rail-ink/90"
            >
              <LogIn size={15} strokeWidth={2} aria-hidden="true" />
              Masuk Cloud
            </button>
          </div>
        )}
      </aside>

      <nav
        aria-label="Menu utama ponsel"
        style={{ gridTemplateColumns: `repeat(${PRIMARY_NAV_ITEMS.length}, minmax(0, 1fr))` }}
        className="fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-surface/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {PRIMARY_NAV_ITEMS.map(({ id, label, short, icon: Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-xs font-medium transition-colors duration-150 ${
                active ? "text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              <span
                className={`grid h-7 w-12 place-items-center rounded-full transition-colors duration-150 ${
                  active ? "bg-brand text-brand-ink" : ""
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2 : 1.75} aria-hidden="true" />
              </span>
              <span className="truncate">{short}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
