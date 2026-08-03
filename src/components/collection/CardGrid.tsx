import type { Card } from "../../types/card";
import type { CardState } from "../../types/collection";
import { EmptyState } from "../ui/EmptyState";
import { CollectibleCard } from "./CollectibleCard";
import { useTranslation } from "react-i18next";

interface CardGridProps {
  cards: Card[];
  getState: (id: string) => CardState;
  onToggle: (id: string) => void;
  onDuplicatesChange: (id: string, delta: number) => void;
  readOnly?: boolean;
}

export function CardGrid({ cards, getState, onToggle, onDuplicatesChange, readOnly = false }: CardGridProps) {
  const { t } = useTranslation("collection");
  if (!cards.length) {
    return <EmptyState title={t("cards.emptyTitle")} description={t("cards.emptyDescription")} />;
  }
  return (
    <div className="grid grid-cols-2 gap-3 min-[460px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {cards.map((card) => (
        <CollectibleCard
          key={card.id}
          card={card}
          state={getState(card.id)}
          onToggle={() => onToggle(card.id)}
          onDuplicatesChange={(delta) => onDuplicatesChange(card.id, delta)}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}
