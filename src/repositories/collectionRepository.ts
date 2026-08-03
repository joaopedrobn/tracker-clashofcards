import { cards } from "../data/cards";
import { requireSupabase } from "../lib/supabase";
import i18n from "../i18n";
import { localizedDataError } from "../services/dataError";
import type { CardState, CollectionData } from "../types/collection";
import type { RemoteUserCard } from "../types/profile";
import type { RemoteCollectionSnapshot } from "../types/sync";

interface UserCardRow {
  user_id: string;
  card_id: string;
  owned: boolean;
  duplicates: number;
  created_at: string;
  updated_at: string;
}

const validCardIds = new Set(cards.map((card) => card.id));
const USER_CARD_COLUMNS = "user_id,card_id,owned,duplicates,created_at,updated_at";

export function mapUserCard(row: UserCardRow): RemoteUserCard {
  return {
    userId: row.user_id,
    cardId: row.card_id,
    owned: row.owned,
    duplicates: Math.max(0, row.duplicates),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowsToCards(rows: UserCardRow[]): Record<string, CardState> {
  const result: Record<string, CardState> = {};
  rows.forEach((row) => {
    if (!validCardIds.has(row.card_id)) return;
    const duplicates = Math.max(0, Math.floor(row.duplicates || 0));
    result[row.card_id] = { owned: row.owned || duplicates > 0, duplicates };
  });
  return result;
}

async function currentUserId(): Promise<string> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error(i18n.t("sessionExpired", { ns: "errors" }));
  return data.user.id;
}

export async function fetchOwnCollection(playerName = ""): Promise<RemoteCollectionSnapshot> {
  const client = requireSupabase();
  const userId = await currentUserId();
  const [{ data: cardRows, error: cardError }, { data: profileRow, error: profileError }] = await Promise.all([
    client.from("user_cards").select(USER_CARD_COLUMNS).eq("user_id", userId),
    client.from("profiles").select("last_collection_update").eq("id", userId).maybeSingle(),
  ]);
  if (cardError) throw localizedDataError(cardError, "collectionLoad");
  if (profileError) throw localizedDataError(profileError, "collectionLoad");
  const updatedAt = (profileRow as { last_collection_update?: string | null } | null)?.last_collection_update ?? null;
  return {
    collection: {
      version: 2,
      playerName,
      updatedAt,
      cards: rowsToCards((cardRows ?? []) as UserCardRow[]),
      preferences: { category: "all", filter: "all" },
    },
    updatedAt,
  };
}

export async function fetchPublicCollection(userId: string, playerName = ""): Promise<CollectionData> {
  const { data, error } = await requireSupabase()
    .from("user_cards")
    .select(USER_CARD_COLUMNS)
    .eq("user_id", userId);
  if (error) throw localizedDataError(error, "collectionLoad");
  const rows = (data ?? []) as UserCardRow[];
  const updatedAt = rows.reduce<string | null>((latest, row) => {
    if (!latest || row.updated_at > latest) return row.updated_at;
    return latest;
  }, null);
  return {
    version: 2,
    playerName,
    updatedAt,
    cards: rowsToCards(rows),
    preferences: { category: "all", filter: "all" },
  };
}

export async function replaceOwnCollection(collection: CollectionData): Promise<string> {
  const client = requireSupabase();
  const userId = await currentUserId();
  const activeRows = cards.flatMap((card) => {
    const state = collection.cards[card.id];
    if (!state?.owned && !(state?.duplicates > 0)) return [];
    return [{
      user_id: userId,
      card_id: card.id,
      owned: Boolean(state.owned || state.duplicates > 0),
      duplicates: Math.max(0, Math.floor(state.duplicates)),
      updated_at: new Date().toISOString(),
    }];
  });

  const { data: existing, error: readError } = await client
    .from("user_cards")
    .select("card_id")
    .eq("user_id", userId);
  if (readError) throw localizedDataError(readError, "sync");

  if (activeRows.length) {
    const { error } = await client.from("user_cards").upsert(activeRows, { onConflict: "user_id,card_id" });
    if (error) throw localizedDataError(error, "sync");
  }

  const activeIds = new Set(activeRows.map((row) => row.card_id));
  const staleIds = ((existing ?? []) as Array<{ card_id: string }>)
    .map((row) => row.card_id)
    .filter((cardId) => !activeIds.has(cardId));
  if (staleIds.length) {
    const { error } = await client
      .from("user_cards")
      .delete()
      .eq("user_id", userId)
      .in("card_id", staleIds);
    if (error) throw localizedDataError(error, "sync");
  }

  const updatedAt = new Date().toISOString();
  const { error: profileError } = await client
    .from("profiles")
    .update({ last_collection_update: updatedAt, updated_at: updatedAt })
    .eq("id", userId);
  if (profileError) throw localizedDataError(profileError, "sync");
  return updatedAt;
}

export { USER_CARD_COLUMNS, type UserCardRow };
