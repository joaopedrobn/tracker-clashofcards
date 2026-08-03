import { cards } from "../data/cards";
import type { CollectionData } from "../types/collection";

export function hasCollectionCards(collection: CollectionData): boolean {
  return cards.some((card) => {
    const state = collection.cards[card.id];
    return state?.owned || (state?.duplicates ?? 0) > 0;
  });
}

export function mergeCollections(local: CollectionData, remote: CollectionData): CollectionData {
  const mergedCards = Object.fromEntries(cards.flatMap((card) => {
    const localState = local.cards[card.id];
    const remoteState = remote.cards[card.id];
    const duplicates = Math.max(localState?.duplicates ?? 0, remoteState?.duplicates ?? 0);
    const owned = Boolean(localState?.owned || remoteState?.owned || duplicates > 0);
    return owned || duplicates > 0 ? [[card.id, { owned, duplicates }]] : [];
  }));
  return {
    ...local,
    updatedAt: new Date().toISOString(),
    cards: mergedCards,
  };
}

export function collectionCardsEqual(first: CollectionData, second: CollectionData): boolean {
  return cards.every((card) => {
    const a = first.cards[card.id] ?? { owned: false, duplicates: 0 };
    const b = second.cards[card.id] ?? { owned: false, duplicates: 0 };
    return a.owned === b.owned && a.duplicates === b.duplicates;
  });
}
