import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  const { t } = useTranslation("collection");
  return (
    <label className="input-wrapper block flex-1">
      <span className="sr-only">{t("search.label")}</span>
      <Search className="input-icon" size={18} aria-hidden="true" />
      <input
        className="field input-with-icon h-12 w-full pr-10"
        placeholder={t("search.placeholder")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value && (
        <button type="button" className="absolute right-2.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-stone-500 hover:bg-white/8 hover:text-white" onClick={() => onChange("")} aria-label={t("search.clear")}>
          <X size={16} />
        </button>
      )}
    </label>
  );
}
