import { useCallback, useMemo } from "react";
import type { CardFilter, CategoryFilter, CollectionData } from "../types/collection";
import { EMPTY_COLLECTION, loadCollection, saveCollection } from "../services/collectionStorage";
import { summarizeCollection } from "../services/collectionSummary";
import { useLocalStorage } from "./useLocalStorage";
import { clearCollectionCards } from "../services/collectionClear";

export function useCollection() {
  const [collection, setCollection] = useLocalStorage<CollectionData>(
    EMPTY_COLLECTION,
    loadCollection,
    saveCollection,
  );

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
