import { Check, ImageOff, LockKeyhole } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { categories } from "../../data/categories";
import type { Card } from "../../types/card";
import type { CardState } from "../../types/collection";
import { DuplicateCounter } from "./DuplicateCounter";

interface CollectibleCardProps {
  card: Card;
  state: CardState;
  onToggle: () => void;
  onDuplicatesChange: (delta: number) => void;
  readOnly?: boolean;
}

export function CollectibleCard({ card, state, onToggle, onDuplicatesChange, readOnly = false }: CollectibleCardProps) {
  const { t } = useTranslation(["collection", "cards"]);
  const [imageStatus, setImageStatus] = useState<"checking" | "ready" | "failed">("checking");
  const category = categories.find((item) => item.id === card.category);
  const name = t(card.nameKey, { ns: "cards" });

  useEffect(() => {
    let active = true;
    setImageStatus("checking");
    fetch(card.image, { method: "HEAD" })
      .then((response) => {
        const isImage = response.ok && response.headers.get("content-type")?.startsWith("image/");
        if (active) setImageStatus(isImage ? "ready" : "failed");
      })
      .catch(() => active && setImageStatus("failed"));
    return () => { active = false; };
  }, [card.image]);

  return (
    <article className={`collectible-card group ${state.owned ? "is-owned" : "is-missing"}`}>
      <button
        className="block w-full text-left focus-visible:outline-none"
        onClick={onToggle}
        disabled={readOnly}
        aria-pressed={state.owned}
        aria-label={`${name}: ${t(state.owned ? "cards.owned" : "cards.missing", { ns: "collection" })}. ${readOnly ? "" : t("cards.changeHint", { ns: "collection" })}`}
      >
        <div className="card-image-wrap">
          {imageStatus === "ready" ? (
            <img src={card.image} alt={name} className="card-image" onError={() => setImageStatus("failed")} loading="lazy" />
          ) : (
            <div className="card-placeholder" role="img" aria-label={t("cards.imageUnavailable", { ns: "collection", name })}>
              <ImageOff size={28} />
              <span>{name.slice(0, 1)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#101116] via-transparent to-transparent" />
          {state.owned ? (
            <span className="owned-check"><Check size={15} strokeWidth={4} /></span>
          ) : (
            <span className="missing-lock"><LockKeyhole size={13} aria-hidden="true" /> {t("cards.missingBadge", { ns: "collection" })}</span>
          )}
          {state.duplicates > 0 && <span className="duplicate-badge">+{state.duplicates}</span>}
        </div>
        <div className="px-3 pb-2 pt-2.5">
          <h3 className="truncate text-sm font-black text-white sm:text-base">{name}</h3>
          <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wider text-stone-500">{category ? t(category.nameKey, { ns: "collection" }) : ""}</p>
        </div>
      </button>
      {!readOnly && <div className="px-2.5 pb-2.5"><DuplicateCounter cardName={name} value={state.duplicates} onChange={onDuplicatesChange} /></div>}
    </article>
  );
}
