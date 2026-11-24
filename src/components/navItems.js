import { ArrowLeftRight, ChartColumn, LayoutDashboard, Settings, Sparkles, Target } from "lucide-react";

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", short: "Dashboard", icon: LayoutDashboard, primary: true },
  { id: "transactions", label: "Transaksi", short: "Transaksi", icon: ArrowLeftRight, primary: true },
  { id: "budgets", label: "Anggaran", short: "Anggaran", icon: Target, primary: true },
  { id: "reports", label: "Laporan", short: "Laporan", icon: ChartColumn, primary: true },
  { id: "assistant", label: "Asisten AI", short: "Asisten", icon: Sparkles, primary: true },
  { id: "settings", label: "Pengaturan", short: "Pengaturan", icon: Settings, primary: false },
];

export const PRIMARY_NAV_ITEMS = NAV_ITEMS.filter((item) => item.primary);
