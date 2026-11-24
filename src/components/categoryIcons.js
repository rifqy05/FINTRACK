import { createElement } from "react";
import {
  Briefcase,
  Car,
  Film,
  Gift,
  GraduationCap,
  HeartPulse,
  Laptop,
  Receipt,
  ShoppingBag,
  Tag,
  TrendingUp,
  Users,
  Utensils,
  Wifi,
} from "lucide-react";

const CATEGORY_ICON_MAP = {
  Makanan: Utensils,
  Transportasi: Car,
  Belanja: ShoppingBag,
  Tagihan: Receipt,
  Hiburan: Film,
  Kesehatan: HeartPulse,
  Pendidikan: GraduationCap,
  Internet: Wifi,
  Keluarga: Users,
  Gaji: Briefcase,
  Bonus: Gift,
  Freelance: Laptop,
  Investasi: TrendingUp,
  Hadiah: Gift,
  Lainnya: Tag,
};

export function CategoryIcon({ category, size = 16, strokeWidth = 1.8, style, className }) {
  const IconComp = CATEGORY_ICON_MAP[category] ?? Tag;
  return createElement(IconComp, { size, strokeWidth, style, className, "aria-hidden": "true" });
}
