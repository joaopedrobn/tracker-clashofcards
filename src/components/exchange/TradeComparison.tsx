import { ArrowLeftRight, Check, Handshake, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { cards } from "../../data/cards";
import { importCollectionJson, parseCollectionCode } from "../../services/collectionSerializer";
import { compareCollections } from "../../services/tradeComparison";
import type { Card } from "../../types/card";
import type { CollectionData } from "../../types/collection";
import { cardName } from "../../utils/localizedCatalog";
import { Button } from "../ui/Button";

interface TradeComparisonProps {
  mine: CollectionData;
}

function CardPills({ items, empty }: { items: Card[]; empty: string }) {
  if (!items.length) return <p className="text-xs text-stone-500">{empty}</p>;
  return <div className="flex flex-wrap gap-1.5">{items.map((card) => <span key={card.id} className="rounded-lg border border-white/8 bg-white/6 px-2.5 py-1.5 text-xs font-bold text-stone-200">{cardName(card)}</span>)}</div>;
}

export function TradeComparison({ mine }: TradeComparisonProps) {
  const { t, i18n } = useTranslation(["exchange", "errors"]);
  const [input, setInput] = useState("");
  const [theirs, setTheirs] = useState<CollectionData | null>(null);
  const [error, setError] = useState("");
  const result = useMemo(() => (theirs ? compareCollections(cards, mine, theirs) : null), [mine, theirs]);

  const compare = () => {
    try {
      setTheirs(input.trim().startsWith("{") ? importCollectionJson(input) : parseCollectionCode(input));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("errors:invalidCode"));
    }
  };

  return (
    <section className="panel-metal rounded-3xl p-4 sm:p-6" aria-labelledby="comparison-title">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-lg">
          <div className="mb-2 flex items-center gap-2 text-cyan-400"><Handshake size={18} aria-hidden="true" /><span className="text-xs font-black uppercase tracking-[0.18em]">{t("exchange:compare.eyebrow")}</span></div>
          <h2 id="comparison-title" className="font-display text-2xl text-white sm:text-3xl">{t("exchange:compare.title")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-stone-400">{t("exchange:compare.description")}</p>
        </div>
        <div className="w-full lg:max-w-xl">
          <textarea className="field h-24 w-full resize-none font-mono text-xs" placeholder={t("exchange:compare.placeholder")} value={input} onChange={(event) => { setInput(event.target.value); setError(""); }} aria-label={t("exchange:compare.inputLabel")} lang={i18n.language} />
          {error && <p className="mt-2 text-xs font-bold text-red-400" role="alert">{error}</p>}
          <Button className="mt-2 w-full sm:w-auto" disabled={!input.trim()} onClick={compare}><Search size={16} aria-hidden="true" /> {t("exchange:compare.analyze")}</Button>
        </div>
      </div>

      {result && theirs && (
        <div className="mt-6 border-t border-white/8 pt-6">
          <div className="mb-4 flex items-center justify-between gap-3"><p className="text-sm font-black text-white">{t("exchange:compare.with", { name: theirs.playerName || t("exchange:compare.other") })}</p><button className="rounded-lg p-1 text-stone-500 hover:bg-white/8 hover:text-white" onClick={() => setTheirs(null)} aria-label={t("exchange:compare.close")}><X size={17} /></button></div>
          {result.directTrades.length > 0 && (
            <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/7 p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-300"><Check size={16} aria-hidden="true" /> {t("exchange:compare.direct")}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {result.directTrades.map((trade) => <div key={`${trade.mine.id}-${trade.theirs.id}`} className="flex items-center justify-between gap-2 rounded-xl bg-black/20 px-3 py-2 text-xs"><span className="font-bold text-stone-300">{cardName(trade.mine)}</span><ArrowLeftRight size={14} className="shrink-0 text-emerald-400" aria-hidden="true" /><span className="font-bold text-stone-300">{cardName(trade.theirs)}</span></div>)}
              </div>
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="comparison-box"><h3>{t("exchange:compare.theirsForMe")} <strong>{result.theirsForMe.length}</strong></h3><CardPills items={result.theirsForMe} empty={t("exchange:compare.noneUseful")} /></div>
            <div className="comparison-box"><h3>{t("exchange:compare.mineForThem")} <strong>{result.mineForThem.length}</strong></h3><CardPills items={result.mineForThem} empty={t("exchange:compare.noneUseful")} /></div>
            <div className="comparison-box"><h3>{t("exchange:compare.bothNeed")} <strong>{result.bothNeed.length}</strong></h3><CardPills items={result.bothNeed} empty={t("exchange:compare.noneCommon")} /></div>
            <div className="comparison-box"><h3>{t("exchange:compare.noMatch")} <strong>{result.unhelpfulMine.length + result.unhelpfulTheirs.length}</strong></h3><CardPills items={[...result.unhelpfulMine, ...result.unhelpfulTheirs].filter((card, index, all) => all.findIndex((item) => item.id === card.id) === index)} empty={t("exchange:compare.allUseful")} /></div>
          </div>
        </div>
      )}
    </section>
  );
}
