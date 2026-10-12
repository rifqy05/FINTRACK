import { Cloud, CloudOff, Loader2, LogIn, LogOut, Plus, User } from "lucide-react";

export default function Header({
  title,
  description,
  period,
  onPeriodChange,
  showPeriod,
  onAdd,
  syncStatus = "local",
  user = null,
  onOpenAuth,
  onSignOut,
}) {
  return (
    <header className="flex flex-col gap-4">
      {/* Baris atas: status sinkronisasi & akun pengguna */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5 sm:hidden">
        <div className="flex items-center gap-1.5 text-xs">
          {syncStatus === "saving" && (
            <span className="inline-flex items-center gap-1 text-ink-soft">
              <Loader2 size={13} className="animate-spin text-brand" /> Menyimpan ke cloud...
            </span>
          )}
          {syncStatus === "saved" && (
            <span className="inline-flex items-center gap-1 font-medium text-brand">
              <Cloud size={13} /> Cloud aktif
            </span>
          )}
          {syncStatus === "error" && (
            <span className="inline-flex items-center gap-1 font-medium text-expense">
              <CloudOff size={13} /> Gagal sinkron
            </span>
          )}
          {syncStatus === "local" && (
            <span className="inline-flex items-center gap-1 text-ink-soft">
              <CloudOff size={13} /> Mode lokal
            </span>
          )}
        </div>

        {user ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="max-w-32 truncate text-ink-soft" title={user.email}>
              {user.email}
            </span>
            <button
              type="button"
              onClick={onSignOut}
              className="text-expense hover:underline"
              title="Keluar"
            >
              Keluar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="text-xs font-medium text-brand hover:underline"
          >
            Masuk Cloud
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>

            {/* Indikator sinkronisasi desktop */}
            <div className="hidden sm:flex sm:items-center">
              {syncStatus === "saving" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand">
                  <Loader2 size={12} className="animate-spin" />
                  Menyimpan...
                </span>
              )}
              {syncStatus === "saved" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-brand">
                  <Cloud size={12} />
                  Tersimpan di Cloud
                </span>
              )}
              {syncStatus === "error" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-expense/20 bg-expense-soft px-2.5 py-0.5 text-xs font-medium text-expense">
                  <CloudOff size={12} />
                  Gagal Sinkron
                </span>
              )}
              {syncStatus === "local" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-xs text-ink-soft">
                  <CloudOff size={12} />
                  Penyimpanan Lokal
                </span>
              )}
            </div>
          </div>
          {description ? <p className="mt-1 text-sm text-ink-soft">{description}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showPeriod ? (
            <div className="flex items-center gap-2">
              <label htmlFor="period" className="text-sm text-ink-soft">
                Periode
              </label>
              <select
                id="period"
                value={period.type}
                onChange={(event) => onPeriodChange({ type: event.target.value })}
                className="input w-auto min-w-36"
              >
                <option value="month">Bulan ini</option>
                <option value="all">Semua data</option>
              </select>
            </div>
          ) : null}

          {/* Tombol Akun Desktop */}
          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs">
                <User size={14} className="text-brand" aria-hidden="true" />
                <span className="max-w-36 truncate font-medium text-ink" title={user.email}>
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="ml-1 text-ink-soft hover:text-expense"
                  title="Keluar dari akun"
                >
                  <LogOut size={13} aria-hidden="true" />
                  <span className="sr-only">Keluar</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="btn btn-secondary hidden sm:inline-flex"
            >
              <LogIn size={16} strokeWidth={2} aria-hidden="true" />
              Masuk Cloud
            </button>
          )}

          <button type="button" onClick={() => onAdd()} className="btn btn-primary">
            <Plus size={18} strokeWidth={2} aria-hidden="true" />
            Tambah Transaksi
          </button>
        </div>
      </div>
    </header>
  );
}
