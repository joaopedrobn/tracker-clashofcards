import type { CollectionData } from "../types/collection";

export function clearCollectionCards(collection: CollectionData, updatedAt = new Date().toISOString()): CollectionData {
  return {
    ...collection,
    updatedAt,
    cards: {},
  };
}
