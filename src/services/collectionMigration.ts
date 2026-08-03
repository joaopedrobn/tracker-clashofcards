import { cards } from "../data/cards";
import type {
  CardFilter,
  CardState,
  CategoryFilter,
  CollectionData,
  ViewPreferences,
} from "../types/collection";

const LEGACY_CARD_ID_MAP: Record<string, string> = {
  barbarian: "elixir-barbarian",
  archer: "elixir-archer",
  giant: "elixir-giant",
  goblin: "elixir-goblin",
  wizard: "elixir-wizard",
  dragon: "elixir-dragon",
  minion: "dark-elixir-minion",
  "hog-rider": "dark-elixir-hog-rider",
  valkyrie: "dark-elixir-valkyrie",
  golem: "dark-elixir-golem",
  witch: "dark-elixir-witch",
  "raged-barbarian": "builder-base-raged-barbarian",
  "sneaky-archer": "builder-base-sneaky-archer",
  "boxer-giant": "builder-base-boxer-giant",
  bomber: "builder-base-bomber",
  "super-barbarian": "super-troops-super-barbarian",
  "super-archer": "super-troops-super-archer",
  "super-giant": "super-troops-super-giant",
  "super-wizard": "super-troops-super-wizard",
};

const currentCardIds = new Set(cards.map((card) => card.id));
const validCategories = new Set<CategoryFilter>([
  "all",
  "elixir",
  "dark-elixir",
  "builder-base",
  "super-troops",
]);
const validFilters = new Set<CardFilter>(["all", "owned", "missing", "duplicates"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function migrateCardState(value: unknown): CardState | null {
  if (!isRecord(value)) return null;
  const duplicates = typeof value.duplicates === "number" && Number.isFinite(value.duplicates)
    ? Math.max(0, Math.floor(value.duplicates))
    : 0;
  return {
    owned: value.owned === true || duplicates > 0,
    duplicates,
  };
}

function migratePreferences(value: unknown): ViewPreferences {
  if (!isRecord(value)) return { category: "all", filter: "all" };
  const category = validCategories.has(value.category as CategoryFilter)
    ? value.category as CategoryFilter
    : "all";
  const filter = validFilters.has(value.filter as CardFilter)
    ? value.filter as CardFilter
    : "all";
  return { category, filter };
}

export function migrateCollectionData(value: unknown): CollectionData {
  const source = isRecord(value) ? value : {};
  const sourceCards = isRecord(source.cards) ? source.cards : {};
  const migratedCards: Record<string, CardState> = {};

  Object.entries(sourceCards).forEach(([sourceId, rawState]) => {
    const targetId = currentCardIds.has(sourceId) ? sourceId : LEGACY_CARD_ID_MAP[sourceId];
    if (!targetId || !currentCardIds.has(targetId)) return;
    const state = migrateCardState(rawState);
    if (!state) return;
    const existing = migratedCards[targetId];
    migratedCards[targetId] = existing
      ? { owned: existing.owned || state.owned, duplicates: Math.max(existing.duplicates, state.duplicates) }
      : state;
  });

  return {
    version: 2,
    playerName: typeof source.playerName === "string" ? source.playerName : "",
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : null,
    cards: migratedCards,
    preferences: migratePreferences(source.preferences),
  };
}
