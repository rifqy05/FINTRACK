# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary user**: One individual (e.g., Indonesian university student or young professional) tracking personal income, daily expenses, monthly category budgets, and financial trends across laptop and phone.
- **Operating reality**: Uses FinTrack in Bahasa Indonesia with Rupiah (IDR, integer amounts), often switching between local browser usage and optional cloud sync across devices.

## Product Purpose

FinTrack is a personal finance tracker web app for recording income and expenses, monitoring net balance and savings ratio, enforcing monthly category budgets, reviewing 12-month reports, syncing one-way summaries to Google Sheets, and asking an AI Financial Assistant questions answered strictly from deterministic app-computed figures.

## Positioning

Local-first usability with zero mandatory signup, optional cloud sync protected by Row Level Security (no `service_role` key exposed), Indonesian Excel-ready CSV export, one-way Google Sheets sync, and a read-only AI assistant whose figures come 100% from FinTrack's deterministic calculation engine rather than LLM estimates.

## Operating Context

- Core daily ritual: quickly logging an expense or income (cash, QRIS, transfer, e-wallet, debit, credit), checking remaining monthly budget caps (80% warning, 100% exceeded), reviewing monthly balance trends, and periodically exporting CSV/JSON backups or syncing to Google Sheets.
- Runs on desktop browsers (including wide monitors like 1920×1080) and mobile phones (360–390px) in both light and dark ambient lighting.
- *(Inferred after skipped question round)* The user actively uses dark mode on a wide desktop screen (`1920×1080`) and expects a distinct, noticeably elevated visual redesign rather than incremental micro-polish on the prior Tailwind dark-slate template.

## Capabilities and Constraints

- **Stack**: React 19, Vite 8, JavaScript (no TypeScript), Tailwind CSS v4, Recharts, Lucide React, Supabase JS, Node.js HTTP server (`server/`), Vitest (122 tests), Oxlint.
- **Data integrity**: Amounts are positive Rupiah integers; transaction types are `income` and `expense`; deterministic formulas live in `src/utils/financeCalculations.js` and `src/utils/financeSummary.js`.
- **Pages**: Dashboard, Transaksi, Anggaran, Laporan, Asisten AI, Pengaturan (hash-routed `#/<page>`).
- **Out of scope**: Direct bank feeds, real money transfers, two-way Google Sheets sync, mutating AI agents, investments/tax/business accounting, native mobile apps.

## Brand Commitments

- **Name**: FinTrack.
- **Language**: Consistent, natural Bahasa Indonesia throughout UI copy and Rupiah (`id-ID`) formatting.
- **Tone**: Calm, trustworthy, objective personal financial ledger — zero gamification, zero hype, zero developer/infrastructure jargon on user-facing screens.

## Evidence on Hand

- Live React + Vite codebase at `D:\Magang\projek gabut\fintrack` with 6 pages, Supabase schema (`supabase/schema.sql`), Google Apps Script (`google-sheets/Code.gs`), AI server (`server/`), demo dataset (`src/utils/demoData.js`), and 122 passing Vitest unit tests.

## Product Principles

1. **Deterministic financial truth**: Every displayed figure and AI answer comes from verified app calculations.
2. **Low-friction daily capture**: Logging a transaction or checking budget headroom takes seconds on both desktop and phone.
3. **Honest state communication**: Local, cloud-synced, offline, and error states are never misrepresented.
4. **Private by default**: Local mode works fully without an account; cloud sync uses per-user RLS; AI receives aggregate summaries only.

## Accessibility & Inclusion

- WCAG 2.1 AA contrast (≥ 4.5:1 body text, ≥ 3:1 large text) in both light and dark themes.
- Full keyboard navigation, native `<dialog>` focus management, `>= 44×44px` touch targets, `sr-only` data mirrors for charts, and `prefers-reduced-motion` support.
