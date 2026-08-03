import type { CardFilter } from "../../types/collection";
import { useTranslation } from "react-i18next";

const filters: CardFilter[] = ["all", "owned", "missing", "duplicates"];

interface CardFiltersProps {
  value: CardFilter;
  counts: Record<CardFilter, number>;
  onChange: (filter: CardFilter) => void;
}

export function CardFilters({ value, counts, onChange }: CardFiltersProps) {
  const { t } = useTranslation("collection");
  return (
    <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/8 bg-black/20 p-1.5" aria-label={t("filters.aria")}>
      {filters.map((filter) => (
        <button
          key={filter}
          className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black transition ${value === filter ? "bg-white/12 text-white shadow-sm" : "text-stone-500 hover:text-stone-200"}`}
          onClick={() => onChange(filter)}
          aria-pressed={value === filter}
        >
          {t(`filters.${filter}`)} <span className="ml-1 text-[10px] opacity-60">{counts[filter]}</span>
        </button>
      ))}
    </div>
  );
}
