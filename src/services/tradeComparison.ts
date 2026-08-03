import type { Card } from "../types/card";
import type { CollectionData } from "../types/collection";
import type { TradeComparisonResult, TradeOpportunitySummary } from "../types/trade";
import { cards as catalog } from "../data/cards";

export function compareCollections(
  cards: Card[],
  mine: CollectionData,
  theirs: CollectionData,
): TradeComparisonResult {
  const theirsForMe = cards.filter(
    (card) => !mine.cards[card.id]?.owned && (theirs.cards[card.id]?.duplicates ?? 0) > 0,
  );
  const mineForThem = cards.filter(
    (card) => !theirs.cards[card.id]?.owned && (mine.cards[card.id]?.duplicates ?? 0) > 0,
  );
  const directTrades = mineForThem
    .slice(0, Math.min(mineForThem.length, theirsForMe.length))
    .map((mineCard, index) => ({ mine: mineCard, theirs: theirsForMe[index] }));
  const bothNeed = cards.filter(
    (card) => !mine.cards[card.id]?.owned && !theirs.cards[card.id]?.owned,
  );
  const unhelpfulMine = cards.filter(
    (card) => (mine.cards[card.id]?.duplicates ?? 0) > 0 && theirs.cards[card.id]?.owned,
  );
  const unhelpfulTheirs = cards.filter(
    (card) => (theirs.cards[card.id]?.duplicates ?? 0) > 0 && mine.cards[card.id]?.owned,
  );

  return { theirsForMe, mineForThem, directTrades, bothNeed, unhelpfulMine, unhelpfulTheirs };
}

export function calculateTradeOpportunitySummary(
  mine: CollectionData,
  theirs: CollectionData,
): TradeOpportunitySummary {
  const comparison = compareCollections(catalog, mine, theirs);
  return {
    theyCanOfferCount: comparison.theirsForMe.length,
    iCanOfferCount: comparison.mineForThem.length,
  };
}
