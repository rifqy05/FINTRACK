import { Wallet } from "lucide-react";
import { NAV_ITEMS } from "./navItems.js";

// Desktop: sidebar di kiri. Ponsel dan tablet: menu ringkas di bagian bawah layar.
export default function Sidebar({ current, onNavigate }) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
        <div className="flex items-center gap-2.5 px-2">
          <span className="grid size-9 place-items-center rounded-lg bg-brand text-brand-ink">
            <Wallet size={20} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">FinTrack</span>
        </div>

        <nav aria-label="Menu utama" className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const active = current === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150 ${
                  active ? "bg-brand-soft text-brand" : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </nav>

        <p className="mt-auto px-2 text-xs leading-relaxed text-ink-soft">
          Data tersimpan di browser ini saja. Buat backup berkala di Pengaturan.
        </p>
      </aside>

      <nav
        aria-label="Menu utama ponsel"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {NAV_ITEMS.map(({ id, label, short, icon: Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[0.6875rem] font-medium transition-colors duration-150 ${
                active ? "text-brand" : "text-ink-soft"
              }`}
            >
              <span
                className={`grid h-7 w-12 place-items-center rounded-full transition-colors duration-150 ${
                  active ? "bg-brand-soft" : ""
                }`}
              >
                <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
              </span>
              {short}
            </button>
          );
        })}
      </nav>
    </>
  );
}
