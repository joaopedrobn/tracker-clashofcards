import { Minus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DuplicateCounterProps {
  cardName: string;
  value: number;
  onChange: (delta: number) => void;
}

export function DuplicateCounter({ cardName, value, onChange }: DuplicateCounterProps) {
  const { t } = useTranslation("collection");
  return (
    <div className="flex items-center justify-center gap-1.5 rounded-xl border border-white/9 bg-black/30 p-1" aria-label={t("duplicates.label", { count: value, name: cardName })}>
      <button
        className="grid size-8 place-items-center rounded-lg text-stone-400 transition hover:bg-white/10 hover:text-white disabled:opacity-25"
        onClick={() => onChange(-1)}
        disabled={value === 0}
        aria-label={t("duplicates.decrease", { name: cardName })}
      >
        <Minus size={15} strokeWidth={3} />
      </button>
      <span className="min-w-7 text-center text-sm font-black text-white">{value}</span>
      <button
        className="grid size-8 place-items-center rounded-lg bg-amber-400 text-stone-950 shadow-[0_2px_0_#9a5b0a] transition hover:brightness-110 active:translate-y-0.5"
        onClick={() => onChange(1)}
        aria-label={t("duplicates.increase", { name: cardName })}
      >
        <Plus size={15} strokeWidth={3} />
      </button>
    </div>
  );
}
