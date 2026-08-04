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

export function loadCollectionFromKey(key: string): CollectionData {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return EMPTY_COLLECTION;
    return migrateCollectionData(JSON.parse(raw));
  } catch {
    return EMPTY_COLLECTION;
  }
}

export function saveCollectionToKey(key: string, collection: CollectionData): void {
  localStorage.setItem(key, JSON.stringify(collection));
}

export function loadCollection(): CollectionData { return loadCollectionFromKey(STORAGE_KEY); }
export function saveCollection(collection: CollectionData): void { saveCollectionToKey(STORAGE_KEY, collection); }

export function clearStoredCollection(): void {
  localStorage.removeItem(STORAGE_KEY);
}
