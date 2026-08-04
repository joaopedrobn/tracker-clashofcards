import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react";
import type { CardFilter, CategoryFilter, CollectionData } from "../types/collection";
import { EMPTY_COLLECTION, loadCollectionFromKey, saveCollectionToKey, STORAGE_KEY } from "../services/collectionStorage";
import { summarizeCollection } from "../services/collectionSummary";
import { clearCollectionCards } from "../services/collectionClear";

export function useCollection(storageKey = STORAGE_KEY) {
  const [stored, setStored] = useState(() => ({ key: storageKey, value: typeof window === "undefined" ? EMPTY_COLLECTION : loadCollectionFromKey(storageKey) }));
  const collection = stored.key === storageKey ? stored.value : loadCollectionFromKey(storageKey);
  useEffect(() => { setStored((current) => current.key === storageKey ? current : { key: storageKey, value: loadCollectionFromKey(storageKey) }); }, [storageKey]);
  useEffect(() => { if (stored.key === storageKey) saveCollectionToKey(storageKey, stored.value); }, [storageKey, stored]);
  const setCollection = useCallback((action: SetStateAction<CollectionData>) => {
    setStored((current) => {
      const value = current.key === storageKey ? current.value : loadCollectionFromKey(storageKey);
      return { key: storageKey, value: typeof action === "function" ? action(value) : action };
    });
  }, [storageKey]);

  const toggleOwned = useCallback((cardId: string) => {
    setCollection((current) => {
      const state = current.cards[cardId] ?? { owned: false, duplicates: 0 };
      if (state.owned && state.duplicates > 0) return current;
      return {
        ...current,
        updatedAt: new Date().toISOString(),
        cards: { ...current.cards, [cardId]: { ...state, owned: !state.owned } },
      };
    });
  }, [setCollection]);

  const changeDuplicates = useCallback((cardId: string, delta: number) => {
    setCollection((current) => {
      const state = current.cards[cardId] ?? { owned: false, duplicates: 0 };
      return {
        ...current,
        updatedAt: new Date().toISOString(),
        cards: {
          ...current.cards,
          [cardId]: { owned: delta > 0 ? true : state.owned, duplicates: Math.max(0, state.duplicates + delta) },
        },
      };
    });
  }, [setCollection]);

  const setPreference = useCallback((key: "category" | "filter", value: CategoryFilter | CardFilter) => {
    setCollection((current) => ({
      ...current,
      preferences: { ...current.preferences, [key]: value },
    }));
  }, [setCollection]);

  const summary = useMemo(() => summarizeCollection(collection), [collection]);

  const replaceCollection = useCallback((next: CollectionData) => {
    setCollection({ ...next, updatedAt: next.updatedAt ?? new Date().toISOString() });
  }, [setCollection]);
  const clearCollection = useCallback(() => setCollection((current) => clearCollectionCards(current)), [setCollection]);
  return {
    collection,
    summary,
    toggleOwned,
    changeDuplicates,
    setPreference,
    replaceCollection,
    clearCollection,
  };
}
