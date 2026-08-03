import type { CardCategory } from "./card";

export type CardFilter = "all" | "owned" | "missing" | "duplicates";
export type CategoryFilter = "all" | CardCategory;

export interface CardState {
  owned: boolean;
  duplicates: number;
}

export interface ViewPreferences {
  category: CategoryFilter;
  filter: CardFilter;
}

export interface CollectionData {
  version: 2;
  playerName: string;
  updatedAt: string | null;
  cards: Record<string, CardState>;
  preferences: ViewPreferences;
}

export interface CollectionSummaryData {
  collected: number;
  total: number;
  percentage: number;
  missing: number;
  duplicateTypes: number;
  duplicateCopies: number;
}
