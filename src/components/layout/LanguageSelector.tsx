import { Check, ChevronDown, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AppLanguage } from "../../i18n/languageStorage";

export function LanguageSelector() {
  const { t, i18n } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current: AppLanguage = i18n.language.startsWith("pt") ? "pt-BR" : "en";

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeWithKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeWithKeyboard);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeWithKeyboard);
    };
  }, [open]);

  const select = (language: AppLanguage) => {
    void i18n.changeLanguage(language);
    setOpen(false);
  };

  return <div className="relative" ref={containerRef}>
    <button type="button" className="inline-flex h-10 min-w-0 items-center gap-1 whitespace-nowrap rounded-xl border border-white/10 bg-white/6 px-2 text-xs font-black text-stone-200 transition hover:bg-white/10 sm:gap-1.5 sm:px-2.5" aria-label={`${t("language.select")}: ${current === "pt-BR" ? t("language.portuguese") : t("language.english")}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <Languages size={16} className="shrink-0" aria-hidden="true" /><span>{current === "pt-BR" ? "PT" : "EN"}</span><ChevronDown size={13} className="hidden shrink-0 min-[360px]:block" aria-hidden="true" />
    </button>
    {open && <div className="panel-metal absolute right-0 top-12 z-50 w-[min(14rem,calc(100vw-1.5rem))] rounded-2xl p-2 shadow-2xl" role="menu" aria-label={t("language.select")}>
      <LanguageOption label={t("language.portuguese")} active={current === "pt-BR"} onClick={() => select("pt-BR")} />
      <LanguageOption label={t("language.english")} active={current === "en"} onClick={() => select("en")} />
    </div>}
  </div>;
}

function LanguageOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" role="menuitem" className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold text-stone-200 hover:bg-white/8 focus-visible:bg-white/8" onClick={onClick}><span>{label}</span>{active && <Check size={16} className="text-amber-300" aria-hidden="true" />}</button>;
}
