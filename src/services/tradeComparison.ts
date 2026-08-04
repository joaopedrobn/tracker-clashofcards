import type { Card } from "../types/card";
import type { CollectionData } from "../types/collection";
import type { TradeComparisonResult, TradeOpportunitySummary } from "../types/trade";
import { cards as catalog } from "../data/cards";
import type { ClashAccountCollection, AccountTradeOpportunity } from "../types/clashAccount";
import type { AccountTradeSummary, MultiAccountTradeComparison } from "../types/trade";
import type { ClashAccount } from "../types/clashAccount";

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

function accountOpportunities(sources: ClashAccountCollection[], targets: ClashAccountCollection[]): AccountTradeOpportunity[] {
  const unique = new Map<string, AccountTradeOpportunity>();
  sources.forEach((source) => targets.forEach((target) => catalog.forEach((card) => {
    if ((source.collection.cards[card.id]?.duplicates ?? 0) <= 0 || target.collection.cards[card.id]?.owned) return;
    const opportunity = { cardId: card.id, sourceAccountId: source.account.id, targetAccountId: target.account.id };
    unique.set(`${card.id}:${source.account.id}:${target.account.id}`, opportunity);
  })));
  return [...unique.values()];
}

export function compareAllAccounts(mine: ClashAccountCollection[], theirs: ClashAccountCollection[]): MultiAccountTradeComparison {
  return { theirsForMe: accountOpportunities(theirs, mine), mineForThem: accountOpportunities(mine, theirs) };
}

export function calculateAccountTradeSummary(
  selectedMyAccountId: string | null,
  myCollectionsByAccount: Record<string, CollectionData>,
  otherAccounts: ClashAccount[],
  otherCollectionsByAccount: Record<string, CollectionData>,
): AccountTradeSummary {
  if (!selectedMyAccountId || !myCollectionsByAccount[selectedMyAccountId]) return { theyCanOfferCount: 0, iCanOfferCount: 0 };
  const mine = myCollectionsByAccount[selectedMyAccountId];
  const theirsForMe = new Set<string>();
  const mineForThem = new Set<string>();
  otherAccounts.forEach((account) => {
    const theirs = otherCollectionsByAccount[account.id];
    if (!theirs) return;
    catalog.forEach((card) => {
      if ((theirs.cards[card.id]?.duplicates ?? 0) > 0 && !mine.cards[card.id]?.owned) theirsForMe.add(`${card.id}:${account.id}:${selectedMyAccountId}`);
      if ((mine.cards[card.id]?.duplicates ?? 0) > 0 && !theirs.cards[card.id]?.owned) mineForThem.add(`${card.id}:${selectedMyAccountId}`);
    });
  });
  return { theyCanOfferCount: theirsForMe.size, iCanOfferCount: mineForThem.size };
}

export function calculateSelectedAccountTradeSummary(
  selectedMyAccountId: string | null,
  myCollectionsByAccount: Record<string, CollectionData>,
  selectedOtherAccountId: string | null,
  otherCollectionsByAccount: Record<string, CollectionData>,
): AccountTradeSummary {
  if (!selectedMyAccountId || !selectedOtherAccountId) {
    return { theyCanOfferCount: 0, iCanOfferCount: 0 };
  }
  const mine = myCollectionsByAccount[selectedMyAccountId];
  const theirs = otherCollectionsByAccount[selectedOtherAccountId];
  if (!mine || !theirs) return { theyCanOfferCount: 0, iCanOfferCount: 0 };
  return calculateTradeOpportunitySummary(mine, theirs);
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
