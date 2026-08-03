import { Album, CheckCircle2, CopyPlus, Layers3, Target } from "lucide-react";
import { categories } from "../../data/categories";
import { useTranslation } from "react-i18next";
import type { CardCategory } from "../../types/card";
import type { CollectionSummaryData } from "../../types/collection";
import { ProgressBar } from "../ui/ProgressBar";

interface CollectionSummaryProps {
  summary: CollectionSummaryData;
  progress: Record<CardCategory, { owned: number; total: number }>;
}

export function CollectionSummary({ summary, progress }: CollectionSummaryProps) {
  const { t } = useTranslation("collection");
  const metrics = [
    { icon: CheckCircle2, label: t("summary.collected"), value: summary.collected, tone: "text-emerald-400" },
    { icon: Target, label: t("summary.missing"), value: summary.missing, tone: "text-orange-400" },
    { icon: Layers3, label: t("summary.duplicateTypes"), value: summary.duplicateTypes, tone: "text-violet-400" },
    { icon: CopyPlus, label: t("summary.duplicateCopies"), value: summary.duplicateCopies, tone: "text-cyan-400" },
  ];

  return (
    <section className="panel-stone relative overflow-hidden rounded-3xl p-4 sm:p-6" aria-labelledby="summary-title">
      <div className="absolute -right-20 -top-28 size-72 rounded-full bg-amber-400/7 blur-3xl" />
      <div className="relative grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div>
          <div className="flex items-center gap-2 text-amber-400"><Album size={18} aria-hidden="true" /><p className="text-xs font-black uppercase tracking-[0.18em]">{t("summary.eyebrow")}</p></div>
          <div className="mt-3 flex items-end gap-3">
            <h2 id="summary-title" className="font-display text-4xl text-white sm:text-5xl">{summary.percentage}%</h2>
            <p className="mb-1.5 text-sm font-bold text-stone-400">{t("summary.progress", { collected: summary.collected, total: summary.total })}</p>
          </div>
          <div className="mt-4"><ProgressBar value={summary.percentage} /></div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {metrics.map(({ icon: Icon, label, value, tone }) => (
              <div key={label} className="rounded-2xl border border-white/7 bg-black/20 p-3">
                <Icon size={17} className={tone} />
                <strong className="mt-2 block text-xl text-white">{value}</strong>
                <span className="block text-[10px] font-bold uppercase tracking-wide text-stone-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {categories.map((category, index) => {
            const current = progress[category.id];
            const percent = current.total ? Math.round((current.owned / current.total) * 100) : 0;
            const colors = ["purple", "purple", "cyan", "orange"] as const;
            return (
              <div key={category.id} className="rounded-2xl border border-white/7 bg-[#111218]/70 p-4">
                <div className="mb-2 flex items-center justify-between gap-2"><span className="text-xs font-black text-stone-300">{t(category.nameKey)}</span><strong className="text-xs text-white">{current.owned}<span className="text-stone-600">/{current.total}</span></strong></div>
                <ProgressBar value={percent} color={colors[index]} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
