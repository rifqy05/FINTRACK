import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FlaskConical,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  Settings,
  User,
  Wallet,
} from "lucide-react";
import SyncStatus from "./SyncStatus.jsx";
import { addMonths, currentMonthKey, shortMonthLabel } from "../utils/dates.js";
import { describeSync } from "../utils/syncState.js";

export default function Header({
  title,
  description,
  period,
  onPeriodChange,
  showPeriod,
  showAdd = true,
  onAdd,
  privacyMode = false,
  onTogglePrivacy,
  syncStatus = "local",
  syncError = null,
  lastSavedAt = null,
  onRetrySync,
  isDemoActive = false,
  user = null,
  onOpenAuth,
  onSignOut,
  currentPage = "dashboard",
  onNavigate,
  announceSync = true,
}) {
  const needsAttention = syncStatus === "error" || syncStatus === "offline";
  const syncInfo = needsAttention ? describeSync(syncStatus, { lastSavedAt, error: syncError }) : null;
  const activeMonth = period?.month || currentMonthKey();
  const isCurrentMonth = activeMonth === currentMonthKey();

  return (
    <header className="flex flex-col gap-3 lg:sticky lg:top-0 lg:z-20 lg:gap-4 lg:bg-canvas lg:pt-6">
      {/* Baris atas ponsel & tablet */}
      <div className="flex items-center justify-between gap-2 border-b border-line pb-2.5 lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-rail text-rail-ink ring-1 ring-rail-line">
            <Wallet size={16} strokeWidth={1.85} aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight">FinTrack</span>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {onTogglePrivacy ? (
            <button
              type="button"
              onClick={onTogglePrivacy}
              aria-pressed={privacyMode}
              aria-label={privacyMode ? "Tampilkan nominal" : "Sembunyikan nominal"}
              title={privacyMode ? "Tampilkan nominal (H)" : "Sembunyikan nominal (H)"}
              className={`btn-icon ${privacyMode ? "bg-surface-2 text-ink" : ""}`}
            >
              {privacyMode ? (
                <EyeOff size={18} strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Eye size={18} strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
          ) : null}

          {user ? (
            <>
              <span className="hidden max-w-36 truncate text-xs text-ink-soft sm:inline" title={user.email}>
                {user.email}
              </span>
              <button
                type="button"
                onClick={onSignOut}
                className="btn-icon hover:bg-expense-soft hover:text-expense"
                aria-label="Keluar dari akun"
                title="Keluar"
              >
                <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium text-ink transition-colors hover:bg-surface-2"
            >
              <LogIn size={15} strokeWidth={2} aria-hidden="true" />
              Masuk
            </button>
          )}

          {onNavigate ? (
            <button
              type="button"
              onClick={() => onNavigate("settings")}
              aria-current={currentPage === "settings" ? "page" : undefined}
              aria-label="Pengaturan"
              title="Pengaturan"
              className={`btn-icon ${currentPage === "settings" ? "bg-surface-2 text-ink" : ""}`}
            >
              <Settings size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Baris utama judul halaman dan kontrol aksi */}
      <div className="flex flex-col gap-3 border-b border-line pb-3.5 sm:flex-row sm:items-end sm:justify-between lg:pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{title}</h1>
            <SyncStatus
              status={syncStatus}
              error={syncError}
              lastSavedAt={lastSavedAt}
              announce={announceSync}
            />
            {isDemoActive ? (
              <span
                className="badge border-warn/30 bg-warn-soft text-warn"
                title="Angka yang ditampilkan memuat data contoh sintetis"
              >
                <FlaskConical size={12} strokeWidth={2} aria-hidden="true" />
                Data contoh
              </span>
            ) : null}
          </div>
          {description ? <p className="mt-1 text-sm text-ink-soft text-pretty">{description}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          {showPeriod ? (
            <div className="flex flex-wrap items-center gap-2">
              {period.type === "month" ? (
                <div
                  role="group"
                  aria-label="Pilih bulan dashboard"
                  className="inline-flex items-center rounded-xl border border-line bg-surface p-1"
                >
                  <button
                    type="button"
                    onClick={() => onPeriodChange({ type: "month", month: addMonths(activeMonth, -1) })}
                    className="inline-flex size-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
                    aria-label="Bulan sebelumnya"
                    title="Bulan sebelumnya"
                  >
                    <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                  </button>
                  <span className="min-w-[4.75rem] px-2 text-center text-xs font-semibold text-ink tabular-nums">
                    {shortMonthLabel(activeMonth)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onPeriodChange({ type: "month", month: addMonths(activeMonth, 1) })}
                    className="inline-flex size-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
                    aria-label="Bulan berikutnya"
                    title="Bulan berikutnya"
                  >
                    <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                  </button>
                </div>
              ) : null}

              <div
                role="group"
                aria-label="Periode ringkasan"
                className="inline-flex rounded-xl border border-line bg-surface p-1"
              >
                <button
                  type="button"
                  aria-pressed={period.type === "month"}
                  onClick={() => onPeriodChange({ type: "month", month: currentMonthKey() })}
                  className={`min-h-9 rounded-lg px-3 text-xs font-medium transition-colors duration-150 ${
                    period.type === "month"
                      ? "bg-surface-3 font-semibold text-ink ring-1 ring-line-strong"
                      : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                  }`}
                  title={!isCurrentMonth && period.type === "month" ? "Kembali ke bulan ini" : undefined}
                >
                  {period.type === "month" && !isCurrentMonth ? "Ke bulan ini" : "Bulan ini"}
                </button>
                <button
                  type="button"
                  aria-pressed={period.type === "all"}
                  onClick={() => onPeriodChange({ type: "all", month: activeMonth })}
                  className={`min-h-9 rounded-lg px-3 text-xs font-medium transition-colors duration-150 ${
                    period.type === "all"
                      ? "bg-surface-3 font-semibold text-ink ring-1 ring-line-strong"
                      : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  Semua data
                </button>
              </div>
            </div>
          ) : null}

          {onTogglePrivacy ? (
            <button
              type="button"
              onClick={onTogglePrivacy}
              aria-pressed={privacyMode}
              aria-label={privacyMode ? "Tampilkan nominal" : "Sembunyikan nominal"}
              title={privacyMode ? "Tampilkan nominal (pintasan: H)" : "Sembunyikan nominal (pintasan: H)"}
              className={`btn-icon hidden border lg:inline-flex ${
                privacyMode
                  ? "border-line-strong bg-surface-3 text-ink"
                  : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink"
              }`}
            >
              {privacyMode ? (
                <EyeOff size={18} strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Eye size={18} strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
          ) : null}

          {showAdd ? (
            <button
              type="button"
              onClick={() => onAdd()}
              className="btn btn-primary hidden lg:inline-flex"
              title="Tambah transaksi baru (pintasan keyboard: N)"
            >
              <Plus size={18} strokeWidth={2.25} aria-hidden="true" />
              Tambah Transaksi
              <kbd className="kbd-hint">N</kbd>
            </button>
          ) : null}
        </div>
      </div>

      {/* Banner perhatian sinkronisasi hanya muncul saat offline atau gagal */}
      {needsAttention && syncInfo ? (
        <div
          role="alert"
          className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-xs leading-relaxed ${
            syncStatus === "error"
              ? "border-expense/30 bg-expense-soft text-expense"
              : "border-warn/30 bg-warn-soft text-warn"
          }`}
        >
          <span className="flex min-w-0 items-center gap-2 text-pretty">
            {user ? <User size={14} className="shrink-0" aria-hidden="true" /> : null}
            {syncInfo.detail}
          </span>
          {onRetrySync ? (
            <button
              type="button"
              onClick={onRetrySync}
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-current/25 bg-surface px-3 font-medium text-ink transition-colors hover:bg-surface-2"
            >
              <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
              Coba lagi
            </button>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
