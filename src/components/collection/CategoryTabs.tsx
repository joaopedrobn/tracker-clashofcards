import { Boxes, Flame, Moon, Sparkles } from "lucide-react";
import { categories } from "../../data/categories";
import { useTranslation } from "react-i18next";
import type { CardCategory } from "../../types/card";
import type { CategoryFilter } from "../../types/collection";

const icons = {
  elixir: Sparkles,
  "dark-elixir": Moon,
  "builder-base": Boxes,
  "super-troops": Flame,
};

interface CategoryTabsProps {
  value: CategoryFilter;
  progress: Record<CardCategory, { owned: number; total: number }>;
  totalOwned: number;
  total: number;
  onChange: (category: CategoryFilter) => void;
}

export function CategoryTabs({ value, progress, totalOwned, total, onChange }: CategoryTabsProps) {
  const { t } = useTranslation("collection");
  return (
    <nav className="category-tabs" aria-label={t("categories.aria")}>
      <button className={`category-tab ${value === "all" ? "active" : ""}`} onClick={() => onChange("all")} aria-pressed={value === "all"}>
        <span className="tab-icon tab-all"><Boxes size={19} /></span>
        <span><strong>{t("categories.all")}</strong><small>{totalOwned}/{total}</small></span>
      </button>
      {categories.map((category) => {
        const Icon = icons[category.id];
        return (
          <button key={category.id} className={`category-tab ${value === category.id ? "active" : ""}`} onClick={() => onChange(category.id)} aria-pressed={value === category.id}>
            <span className={`tab-icon tab-${category.accent}`}><Icon size={19} /></span>
            <span><strong className="hidden sm:block">{t(category.nameKey)}</strong><strong className="sm:hidden">{t(category.shortNameKey)}</strong><small>{progress[category.id].owned}/{progress[category.id].total}</small></span>
          </button>
        );
      })}
    </nav>
  );
}
