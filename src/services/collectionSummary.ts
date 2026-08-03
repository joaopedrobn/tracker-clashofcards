import { cards } from "../data/cards";
import type { CollectionData, CollectionSummaryData } from "../types/collection";

export function summarizeCollection(collection: CollectionData): CollectionSummaryData {
  const collected = cards.filter((card) => collection.cards[card.id]?.owned).length;
  const duplicateTypes = cards.filter((card) => (collection.cards[card.id]?.duplicates ?? 0) > 0).length;
  const duplicateCopies = cards.reduce(
    (total, card) => total + (collection.cards[card.id]?.duplicates ?? 0),
    0,
  );
  return {
    collected,
    total: cards.length,
    percentage: cards.length ? Math.round((collected / cards.length) * 100) : 0,
    missing: cards.length - collected,
    duplicateTypes,
    duplicateCopies,
  };
}
