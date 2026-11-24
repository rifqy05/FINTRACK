---
name: FinTrack
description: Executive Obsidian & Stone personal finance ledger for daily Indonesian Rupiah cashflow control, budget pacing, and deterministic reporting.
colors:
  obsidian-canvas: "#09090b"
  obsidian-rail: "#0d0d0f"
  obsidian-surface: "#121214"
  obsidian-hero: "#18181b"
  obsidian-surface-elevated: "#1a1a1d"
  obsidian-active: "#242428"
  obsidian-hairline: "#27272a"
  obsidian-hairline-strong: "#3a3a3f"
  ivory-action: "#f2f1ec"
  ivory-ink: "#f4f4f2"
  ash-ink-soft: "#9e9d97"
  stone-canvas: "#f3f3ef"
  stone-paper: "#fcfbf9"
  stone-surface-muted: "#ecebe5"
  stone-hairline: "#dfddd4"
  carbon-action: "#111113"
  carbon-ink-soft: "#575652"
  emerald-flow-dark: "#2dd4bf"
  emerald-flow-light: "#046c4e"
  rose-outflow-dark: "#fb7185"
  rose-outflow-light: "#be123c"
  amber-caution-dark: "#fbbf24"
  amber-caution-light: "#92400e"
typography:
  display:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.03em"
    fontFeature: "'tnum' 1"
  headline:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  label:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: "0em"
  mono:
    fontFamily: "Geist Mono Variable, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  xxl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ivory-action}"
    textColor: "{colors.obsidian-canvas}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-primary-light:
    backgroundColor: "{colors.carbon-action}"
    textColor: "{colors.stone-paper}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.obsidian-surface}"
    textColor: "{colors.ivory-ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.rose-outflow-dark}"
    textColor: "{colors.obsidian-canvas}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  input-field:
    backgroundColor: "{colors.obsidian-surface}"
    textColor: "{colors.ivory-ink}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "44px"
  card-surface:
    backgroundColor: "{colors.obsidian-surface}"
    textColor: "{colors.ivory-ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  hero-deck:
    backgroundColor: "{colors.obsidian-hero}"
    textColor: "{colors.ivory-ink}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: FinTrack

## Overview

**Creative North Star: "Obsidian & Stone Ledger"**

FinTrack treats personal Rupiah bookkeeping as a quiet executive instrument rather than a playful fintech feed. In dark mode, the interface settles into true matte volcanic obsidian and stepped mineral charcoal surfaces separated by razor-thin stone-ash hairlines, anchoring every screen with warm ivory primary controls and zero midnight-blue SaaS tint. In light mode, the workspace opens onto warm architectural stone paper while keeping a committed obsidian left navigation rail and an obsidian Cashflow Command Deck, giving both themes the same unmistakable editorial composure.

Information density is deliberate and scannable at a glance. Within two seconds of opening the workspace, the eye moves from the stepped Hero Cashflow Deck (headline net balance, proportional income-versus-expense allocation ribbon, and hairline-divided supporting metrics) to the inline daily capture card, analytical charts, calendar-paced budget bars, and modern banking-ledger rows. Chromatic saturation is strictly rationed: structural chrome stays monochrome obsidian, carbon, stone, and ivory so emerald-teal and rose-coral register instantaneously as money coming in or going out.

We explicitly reject generic midnight-blue Tailwind slate templates, glowing indigo/periwinkle SaaS buttons, floating ghost-card shadows, side-striped rounded boxes, repetitive equal-size icon-card grids, and decorative glass blur.

**Key Characteristics:**
- Matte volcanic obsidian dark theme (`#09090b` canvas, `#121214` cards, `#18181b` focal deck) paired with warm architectural stone light theme (`#f3f3ef` canvas, `#fcfbf9` paper) and a persistent obsidian rail (`#0d0d0f` dark / `#111113` light).
- Monochrome high-contrast primary actions (warm ivory `#f2f1ec` in dark mode; deep carbon `#111113` in light mode) so one CTA clearly leads each view.
- Strict semantic color rationing: emerald-teal and rose-coral appear exclusively on financial flows, balances, chart series, and budget/validation thresholds.
- Self-hosted Geist Variable and Geist Mono Variable with strict tabular numerals (`tabular-nums`) on every Rupiah amount, percentage, date, and pagination count.
- Signature financial telemetry: proportional allocation ribbon, inline `Catat cepat` entry card, calendar-day vertical budget pace markers, and category-icon banking ledger rows.

## Colors

The palette pairs neutral-to-warm mineral architectural neutrals with tightly rationed jewel semantics reserved strictly for cashflow direction and threshold states.

### Primary
- **Warm Ivory Action** (`#f2f1ec` on dark): Primary button fill, active monochrome switches, and mobile FAB in dark mode. Paired exclusively with Obsidian Canvas ink (`#09090b`) for >16:1 contrast.
- **Deep Carbon Action** (`#111113` on light): Primary button fill, committed navigation rail, Hero Command Deck ground, and mobile FAB in light mode. Paired with Stone Paper ink (`#fcfbf9`).

### Secondary
- **Emerald Flow** (`#2dd4bf` dark / `#046c4e` light): Positive cashflow, income badges, cumulative balance area curve, remaining allocation bar, and on-track budget bars.
- **Rose Outflow** (`#fb7185` dark / `#be123c` light): Outgoing expenses, spent allocation bar, exceeded budget warnings (≥100%), validation errors, and destructive delete confirmations.
- **Amber Caution** (`#fbbf24` dark / `#92400e` light): Approaching budget thresholds (80%–99%), offline warnings, dirty-form discard prompts, and explicit synthetic `Data contoh` indicators.

### Neutral
- **Obsidian Canvas** (`#09090b`): Base matte page ground in dark mode with zero blue cast.
- **Obsidian Rail** (`#0d0d0f` dark / `#111113` light): Fixed left navigation rail anchored edge-to-edge across desktop viewports.
- **Obsidian Surface** (`#121214`): Standard matte card container in dark mode.
- **Obsidian Hero Deck** (`#18181b`): Elevated focal plate for the Dashboard Balance Deck, Budgets Utilization Deck, and Reports Monthly Summary Deck, stepped clearly above standard cards with a stronger hairline (`#34343a`).
- **Carbon Elevated & Active** (`#1a1a1d`, `#242428`): Input wells, icon emblems, segmented tracks, and active toggle/nav fills in dark mode.
- **Stone Ash Hairlines & Ink** (`#27272a`, `#3a3a3f`, `#f4f4f2`, `#9e9d97`): Crisp 1px architectural dividers and WCAG AA+ body/secondary text in dark mode.
- **Warm Architectural Stone & Paper** (`#f3f3ef`, `#fcfbf9`, `#ecebe5`, `#dfddd4`, `#575652`): Light-mode canvas, card surfaces, muted wells, 1px stone hairlines, and muted charcoal copy.

### Named Rules
**The Money-Flow Only Rule.** Emerald-teal and rose-coral are reserved strictly for money movement, financial trend series, budget status thresholds, and destructive/error feedback. Never apply emerald-teal to brand logos, navigation icons, theme switches, or general UI chrome.

**The Mineral Category Palette Rule.** Expense category charts and icon emblems use a calibrated 10-tone mineral editorial spectrum (ochre, steel blue, muted plum, terracotta, dusty slate, sage, brass, petrol, pewter, stone ash) distinct from emerald-teal income and rose-coral expense so category slices never collide visually with cashflow direction.

**The Zero Blue-Slate Rule.** Dark neutrals stay neutral-mineral (`#09090b`, `#121214`, `#18181b`, `#27272a`, `#9e9d97`) without blue-channel tinting, ensuring FinTrack never regresses into a generic midnight-blue SaaS dashboard.

## Typography

**Display Font:** Geist Variable (fallback: `ui-sans-serif, system-ui, sans-serif`)
**Body Font:** Geist Variable (fallback: `ui-sans-serif, system-ui, sans-serif`)
**Label/Mono Font:** Geist Mono Variable (fallback: `ui-monospace, monospace`)

**Character:** Geometric neo-grotesque clarity engineered for dense financial tables and large Rupiah balance figures, self-hosted via `@fontsource-variable/geist` and `@fontsource-variable/geist-mono` with zero network font flash.

### Hierarchy
- **Display** (600 SemiBold, `1.875rem` mobile → `3rem` / 48px desktop, line-height `1.08`, tracking `-0.03em`): Net balance headline inside the Dashboard Hero Command Deck.
- **Headline** (600 SemiBold, `1.5rem` → `1.75rem`, line-height `1.2`, tracking `-0.02em`, `text-wrap: balance`): Route titles (`Dashboard`, `Transaksi`, `Anggaran`, `Laporan`, `Asisten AI`, `Pengaturan`).
- **Title** (600 SemiBold, `1rem`, line-height `1.35`, tracking `-0.015em`): Panel titles, settings ledger rows, and modal dialog headers.
- **Body** (400 Regular / 500 Medium, `0.875rem`, line-height `1.5`): Ledger descriptions, form controls, prose helper copy (capped at 65–75ch readable width).
- **Label** (500 Medium, `0.75rem`, line-height `1.33`): Table column headings, chart axis ticks, period subtitles, status badges, and metric labels.
- **Mono** (500 Medium, `0.6875rem`–`0.75rem`): Keyboard shortcut keycaps (`N`) and technical code references (`npm run server`, `google-sheets/Code.gs`).

### Named Rules
**The Tabular Numerals Rule.** Every Rupiah figure, percentage, date, axis value, and pagination counter MUST carry `tabular-nums` so vertical ledger columns and live totals align digit-for-digit without horizontal jitter.

**The No-Eyebrow Rule.** Never place uppercase kickers or micro-eyebrows above section headings; let balanced heading scale and spacing establish hierarchy directly.

## Layout

FinTrack anchors its primary workspace directly beside a fixed left obsidian rail (`240px` at `1024px–1279px`, `256px` at `≥1280px`) with no detached left margin gutter on wide desktop screens. The main workspace spans up to `1600px` with responsive horizontal padding (`16px` mobile, `24px` tablet, `32px` desktop, `40px` wide desktop).

A sticky matte desktop utility header (`sticky top-0`, matte canvas background, `1px` bottom hairline) keeps the route title, sync state, optional `Data contoh` badge, segmented period toggle, and primary `+ Tambah Transaksi [N]` button docked during scroll. Sticky side forms on `Budgets` and `Assistant` offset at `top: 112px` so they clear the docked header smoothly.

Dashboard uses a 12-column grid pairing an 8-column Hero Cashflow Deck with a 4-column `@container`-responsive `Catat cepat` form on Row 1, a 7/5 analytics split on Row 2 (`Pemasukan vs pengeluaran` stretching cleanly via flex layout beside `Pengeluaran per kategori`), a 7/5 `Tren saldo` and `Ringkasan anggaran` split on Row 3, and a full-width ledger table on Row 4. Non-chart preference pages (`Settings`) use a single hairline-divided 12-column architectural ledger (`5` cols label/description, `7` cols controls) above a separated danger band. Below `1024px`, the rail collapses into a 5-tab mobile bottom bar (`Dashboard`, `Transaksi`, `Anggaran`, `Laporan`, `Asisten`) while `Pengaturan` moves to the top-right utility icon and a compact `48×48px` circular FAB anchors in the bottom-right thumb zone.

## Elevation & Depth

Elevation relies primarily on **tonal surface stepping and crisp 1px hairlines**, keeping cards flat at rest with zero resting drop shadows. Depth hierarchy is established through luminance steps: Canvas → Card Surface → Elevated Hero Deck (accented by a subtle `inset 0 1px 0` top chamfer highlight and top 42% sheen). Shadows are strictly reserved for floating transient layers (`Modal`, `Toast`, Recharts `ChartTooltip`, and mobile FAB).

### Shadow Vocabulary
- **Hero Chamfer Highlight** (`box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.07)`): Architectural top-edge rim on `.hero-deck` surfaces so the command deck lifts crisply from standard cards without drop-shadow blur.
- **Floating Control Shadow** (`box-shadow: 0 4px 12px rgb(0 0 0 / 0.25)`): Mobile thumb-zone FAB and chart tooltip popover.
- **Overlay Surface Shadow** (`box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.35), 0 8px 10px -6px rgb(0 0 0 / 0.25)`): Native `<dialog>` modals and hovering `Toast` notifications.

### Named Rules
**The Single Elevation Declaration Rule.** Resting cards declare their boundary once via a `1px` hairline border and stepped matte fill—never pair a `1px` border with a wide soft ambient shadow on static cards.

**The One Authored Motion Moment Rule.** Keep page transitions swift (`200ms` `rise-in` with exponential ease-out `cubic-bezier(0.16, 1, 0.3, 1)`) and reserve the primary authored motion moment for the Hero allocation ribbon (`480ms` left-anchored `ribbon-reveal`). All motion collapses to `0.01ms` under `prefers-reduced-motion: reduce`.

## Shapes

Form language is crisp, architectural, and consistent across every interactive tier:
- **Large structural containers (`16px` radius):** Cards, Hero Command Decks, native `<dialog>` modals, and `Toast` shells.
- **Interactive controls (`12px` radius):** Primary/secondary/danger buttons, text/select/date inputs, segmented container tracks, category icon emblems, and desktop sidebar nav links.
- **Nested inner segments (`8px` radius):** Active pills inside segmented tracks, inline quick-add toggles, and secondary icon buttons inside compact banners.
- **Full pills (`9999px` radius):** Status/demo/category badges, proportional allocation ribbons, budget progress tracks, mobile active tab indicator, and mobile FAB.

One-sided accent stripes on rounded boxes are prohibited; active states use full borders, tonal fills, or icon weight shifts.

## Components

### Buttons
Tactile, unambiguous controls enforcing `44px` minimum height across desktop and touch devices, `12px` radius, `16px` horizontal padding, and a `1px` vertical active press response (`translateY(1px)`).
- **Shape:** Gently rounded rectangle (`12px` radius, `min-height: 44px`).
- **Primary:** Warm Ivory fill (`#f2f1ec`) with Obsidian text (`#09090b`) in dark mode; Deep Carbon (`#111113`) with Stone Paper text (`#fcfbf9`) in light mode. Carries keyboard hint badge (`N`) on the main header CTA.
- **Hover / Focus:** `90%` fill opacity on hover; `2px` high-contrast focus ring (`2px` offset) on `:focus-visible`.
- **Secondary / Danger / Icon:** Secondary uses `1px` hairline border + card surface fill shifting to elevated carbon/stone on hover; Danger uses Rose Outflow fill (`#fb7185` / `#be123c`) with high-contrast text; Icon buttons enforce `44×44px` square hit area.

### Badges & Segmented Controls
Compact metadata pills and inline mode switchers that never compete with the sole primary CTA.
- **Badges:** Full pill (`9999px`), `12px` medium text, `1px` border. Monochrome neutral for `Mode lokal`/`Tersimpan`, amber tint for `Data contoh` and `Hampir batas`, emerald tint for `Normal`, rose tint for `Melewati batas`.
- **Segmented Controls:** `12px`-radius outer track (`4px` padding) housing `8px`-radius options (`min-height: 36px–44px`). Active period tab (`Bulan ini | Semua data`) uses lifted carbon/stone fill (`--surface-3`) + hairline ring so the adjacent primary CTA stays visually singular.

### Cards / Containers
Flat matte architectural surfaces without nested card-in-card stacking.
- **Corner Style:** `16px` radius (`rounded-2xl`).
- **Background:** Obsidian Surface (`#121214`) in dark mode; Stone Paper (`#fcfbf9`) in light mode.
- **Border:** Single `1px` hairline (`#27272a` dark / `#dfddd4` light).
- **Internal Padding:** `20px` standard panels, `24px` Hero Decks and desktop Settings ledger rows.

### Inputs / Fields
Clean single-line inputs formatted for fast Indonesian Rupiah data entry.
- **Style:** `44px` min-height, `12px` radius, `1px` hairline border, `14px` horizontal padding, matte surface background, `Rp` prefix + live thousand-separator formatting (`35.000`) with `inputMode="numeric"` and `tabular-nums`.
- **Focus / Error:** Hover strengthens hairline border; `:focus-visible` draws a `2px` monochrome focus outline; `aria-invalid="true"` shifts border to Rose Outflow and pairs with `role="alert"` inline field recovery text.

### Navigation
Committed obsidian desktop rail paired with a 5-tab mobile bottom dock.
- **Desktop Rail (`≥1024px`):** Fixed `240px`/`256px` `#0d0d0f` (dark) / `#111113` (light) rail with hairline right divider, monochrome brand mark, `44px`-tall `12px`-radius nav buttons (active state uses full hairline border + elevated `#212125`/`#242428` fill + ivory icon/label; zero side-stripes), utility divider above `Pengaturan`, and bottom account dock.
- **Mobile Navigation (`<1024px`):** Fixed 5-column bottom bar (`Dashboard`, `Transaksi`, `Anggaran`, `Laporan`, `Asisten`) with solid monochrome pill (`bg-brand text-brand-ink`) on active icon and safe-area inset padding; `Pengaturan` and auth controls sit cleanly in a single-row mobile top bar.

### Signature Components
- **Cashflow Command Deck (`.hero-deck`):** Unified focal ledger plate displaying period net balance (`48px` desktop scale), transaction count pill, animated proportional `Terpakai` (rose) vs `Tersisa` (emerald) allocation ribbon, and hairline-divided 3-column metric strip (`Total pemasukan`, `Total pengeluaran` with month-over-month delta, `Rasio tabungan`) that compacts into a 2-column + inline ratio grid on phones.
- **Inline `Catat cepat` Card:** Container-query (`@container`) daily transaction card beside the Hero Deck enabling 3-second `Keluar`/`Masuk` capture with formatted Rupiah input, quick-amount chips (`15rb`, `25rb`, `50rb`, `100rb`), category selector, inline payment method selector, and optional note without opening a modal.
- **Privacy Mask (`data-privacy="true"`):** Header eye toggle (shortcut `H`) applying a smooth `7px` blur across `.money-mask` figures and chart axes/tooltips without shifting layout, paired with 3-way theme support (`Terang | Gelap | Sistem`) and dynamic `<meta name="theme-color">`.
- **Calendar-Day Budget Pace Marker (`BudgetProgress`):** Horizontal `10px` rounded budget track with a crisp `2px` vertical marker pinned at `(today / daysInMonth) * 100%` so users see immediately whether spending is ahead of or behind the current day of the month, with clickable category drill-down to `Transaksi`.
- **Category-Icon Banking Ledger (`TransactionTable`) & Recurring Templates (`RecurringModal`):** Full-width ledger table (mobile card list below `768px`) pairing `36×36px` mineral category emblems, tabular dates, right-aligned signed `+`/`-` Rupiah amounts, Undo toast recovery on delete, and 1-click idempotent monthly recurring templates.

## Do's and Don'ts

### Do:
- **Do** keep dark surfaces in the true matte obsidian-to-carbon mineral spectrum (`#09090b` → `#121214` → `#18181b` → `#242428`) and light surfaces in warm stone (`#f3f3ef` → `#fcfbf9`) anchored by a committed obsidian rail (`#111113`).
- **Do** restrict emerald-teal and rose-coral strictly to financial direction, charts, budget health, and error/destructive feedback.
- **Do** apply `tabular-nums` to every Rupiah amount, percentage, date, and metric across all routes, and format currency inputs with live Indonesian dot separators (`35.000`).
- **Do** label synthetic demonstration datasets visibly (`Data contoh` badge) whenever `demo-*` rows are loaded.
- **Do** keep every interactive target at least `44×44px`, pair color status with icons and Bahasa Indonesia labels, and theme browser surfaces (`::selection`, `caret-color`, scrollbars, `:focus-visible`).
- **Do** use hairline-divided architectural ledger rows (`divide-y divide-line`) for preference/settings screens instead of equal-size icon-card grids.

### Don't:
- **Don't** introduce midnight-blue slate tints (`#0f172a`, `#1e293b`) or generic indigo/periwinkle buttons (`#6366f1`, `#818cf8`) anywhere in dark or light mode.
- **Don't** use emerald-teal on non-financial UI chrome (logos, navigation icons, theme toggles, or neutral sync badges).
- **Don't** place side-stripe bars down one edge of rounded cards or navigation items, or stack cards inside cards.
- **Don't** add eyebrow/kicker micro-labels above headings, gradient text, decorative backdrop blur on resting cards, or hard offset shadows.
- **Don't** lower-case Indonesian month names inside prose (`periode November 2026`, never `periode november 2026`) or drop uniform tick cadences on 12-month charts.
