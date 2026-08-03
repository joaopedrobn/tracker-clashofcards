import type { CollectionData } from "../types/collection";
import { migrateCollectionData } from "./collectionMigration";

export const STORAGE_KEY = "clash-card-tracker-v1";

export const EMPTY_COLLECTION: CollectionData = {
  version: 2,
  playerName: "",
  updatedAt: null,
  cards: {},
  preferences: { category: "all", filter: "all" },
};

export function loadCollection(): CollectionData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_COLLECTION;
    return migrateCollectionData(JSON.parse(raw));
  } catch {
    return EMPTY_COLLECTION;
  }
}

export function saveCollection(collection: CollectionData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
}

export function clearStoredCollection(): void {
  localStorage.removeItem(STORAGE_KEY);
}
