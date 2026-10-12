import { ArrowLeftRight, ChartColumn, LayoutDashboard, Settings, Sparkles, Target } from "lucide-react";

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", short: "Beranda", icon: LayoutDashboard },
  { id: "transactions", label: "Transaksi", short: "Transaksi", icon: ArrowLeftRight },
  { id: "budgets", label: "Anggaran", short: "Anggaran", icon: Target },
  { id: "reports", label: "Laporan", short: "Laporan", icon: ChartColumn },
  { id: "assistant", label: "Asisten AI", short: "Asisten", icon: Sparkles },
  { id: "settings", label: "Pengaturan", short: "Atur", icon: Settings },
];
