---
version: 1
slug: "src-app-jsx"
primary_target: "src/App.jsx"
related_targets: ["src/pages/Dashboard.jsx","src/pages/Transactions.jsx","src/pages/Budgets.jsx","src/pages/Reports.jsx","src/pages/Assistant.jsx","src/pages/Settings.jsx"]
---

# Surface Brief: FinTrack App Shell & Core Workspace

- **Scope**: Application shell (`src/App.jsx`, `Sidebar`, `Header`) and all 6 primary routes (`Dashboard`, `Transactions`, `Budgets`, `Reports`, `Assistant`, `Settings`).
- **Visitor Mode**: Operate (personal finance ledger and daily cashflow control desk).
- **Audience & Task**: Individual Indonesian user tracking Rupiah income, expenses, monthly category budgets, 12-month trends, and read-only AI summaries across wide desktop monitors (`1920×1080`, `1280×800`) and phones (`390×844`).
- **Constraints**: Preserve all existing features, Supabase RLS cloud sync, Google Sheets sync, AI Assistant, 122 Vitest unit tests, WCAG 2.1 AA contrast in light and dark themes, and Bahasa Indonesia copy.

## Direction contract

- **THESIS**: Replace the generic midnight-blue SaaS card template with an executive personal-finance command desk ("Obsidian & Stone Ledger") where a unified Cashflow Command Deck, inline quick-entry capture, category-icon banking ledger, and calendar-day budget pace markers deliver instant daily spending clarity at wide-desktop scale (`1440px`) and mobile thumb reach.
- **OWN-WORLD**: True matte obsidian dark ground (`#090B0E`) with stepped carbon surfaces (`#12151C`, `#191D26`), warm architectural stone light ground (`#F3F3EF`) anchored by a committed obsidian navigation rail (`#111318`), crisp 1px hairlines (`#232836` dark / `#DFDDD5` light), high-contrast ivory/carbon primary controls (zero generic indigo/periwinkle), Geist Variable + tabular Rupiah numerals, and emerald-teal (`#2DD4BF` / `#047857`) plus rose-coral (`#FB7185` / `#BE123C`) reserved strictly for money flow. Raised from declined challengers: Saville catalog (committed matte obsidian surfaces with high-contrast monochrome controls), Design Annual (disciplined 1px hairline grids and wide-screen spatial composure), Star Atlas (unmistakable magnitude hierarchy), and Centre-Rail Reference (quiet state clarity).
- **STORY**: Within two seconds of opening FinTrack, the user sees net balance, proportional income-vs-expense allocation, whether spending is ahead or behind monthly calendar pace, and can record a new Rupiah transaction inline without leaving the dashboard or opening a modal.
- **FIRST VIEWPORT**: Left 248px committed obsidian rail with navigation and account dock; top sticky utility header with page title, sync pill, segmented period switcher (`Bulan ini | Semua data`), and `+ Tambah Transaksi` button; below it, a 12-column wide command deck pairing an 8-column Unified Balance & Cashflow Deck (headline net balance, proportional allocation ribbon, 3-column hairline metric strip) with a 4-column inline `Catat cepat` form, followed immediately by the gradient Area/Bar analytics and category-icon transaction ledger.
- **FORM**: Precision Obsidian & Stone Financial Desk (candidate #5 on ordered grounded list; `seed:852efbd4d0c69258`).
- **FINISH**: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
