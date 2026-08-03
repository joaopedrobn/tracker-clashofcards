import i18n from "../i18n";
import { categories } from "../data/categories";
import type { TFunction } from "i18next";
import type { Card } from "../types/card";
import type { CollectionData } from "../types/collection";
import { cardName, categoryName } from "../utils/localizedCatalog";

function groupedLines(cards: Card[], collection: CollectionData, tCollection: TFunction, formatter: (card: Card, duplicates: number) => string): string[] {
  return categories.flatMap((category) => {
    const categoryCards = cards.filter((card) => card.category === category.id).sort((a, b) => a.order - b.order);
    if (!categoryCards.length) return [];
    return [`${categoryName(category, tCollection)}:`, ...categoryCards.map((card) => formatter(card, collection.cards[card.id]?.duplicates ?? 0)), ""];
  });
}

export function generateExchangeText(cards: Card[], collection: CollectionData, language = i18n.language): string {
  const t = i18n.getFixedT(language, "exchange");
  const tCards = i18n.getFixedT(language, "cards");
  const tCollection = i18n.getFixedT(language, "collection");
  const missing = cards.filter((card) => !collection.cards[card.id]?.owned);
  const duplicates = cards.filter((card) => (collection.cards[card.id]?.duplicates ?? 0) > 0);
  const collected = cards.length - missing.length;
  const owner = collection.playerName.trim() ? t("text.owner", { name: collection.playerName.trim().toUpperCase() }) : "";
  const lines = [t("text.title", { owner }), ""];
  if (missing.length) lines.push(t("text.missing"), "", ...groupedLines(missing, collection, tCollection, (card) => `- ${cardName(card, tCards)}`));
  if (duplicates.length) lines.push(t("text.duplicates"), "", ...groupedLines(duplicates, collection, tCollection, (card, count) => `- ${cardName(card, tCards)} x${count}`));
  if (!missing.length && !duplicates.length) lines.push(t("text.complete"), "");
  lines.push(t("text.progress"), "");
  categories.forEach((category) => { const total = cards.filter((card) => card.category === category.id).length; const owned = cards.filter((card) => card.category === category.id && collection.cards[card.id]?.owned).length; lines.push(`${categoryName(category, tCollection)}: ${owned}/${total}`); });
  lines.push("", t("text.total", { count: collected, total: cards.length }));
  return lines.join("\n").trim();
}
