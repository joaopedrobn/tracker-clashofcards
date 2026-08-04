import { cards } from "../data/cards";
import i18n from "../i18n";
import { requireSupabase } from "../lib/supabase";
import { localizedDataError } from "../services/dataError";
import type { AccountCard } from "../types/clashAccount";
import type { CardState, CollectionData } from "../types/collection";
import type { RemoteCollectionSnapshot } from "../types/sync";

export interface AccountCardRow {
  account_id: string;
  card_id: string;
  owned: boolean;
  duplicates: number;
  created_at: string;
  updated_at: string;
}

export const ACCOUNT_CARD_COLUMNS = "account_id,card_id,owned,duplicates,created_at,updated_at";
const validCardIds = new Set(cards.map((card) => card.id));

export function mapAccountCard(row: AccountCardRow): AccountCard {
  return { accountId: row.account_id, cardId: row.card_id, owned: row.owned, duplicates: Math.max(0, row.duplicates), createdAt: row.created_at, updatedAt: row.updated_at };
}

async function currentUserId(): Promise<string> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error(i18n.t("sessionExpired", { ns: "errors" }));
  return data.user.id;
}

async function requireOwnedAccount(accountId: string, ownerId: string): Promise<void> {
  const { data, error } = await requireSupabase().from("clash_accounts").select("id").eq("id", accountId).eq("owner_id", ownerId).maybeSingle();
  if (error) throw localizedDataError(error, "collectionLoad");
  if (!data) throw new Error(i18n.t("accounts.errors.notFound", { ns: "profile" }));
}

function rowsToCollection(accountId: string, playerName: string, rows: AccountCardRow[]): CollectionData {
  const accountRows = rows.filter((row) => row.account_id === accountId);
  const cardStates: Record<string, CardState> = {};
  accountRows.forEach((row) => {
    if (!validCardIds.has(row.card_id)) return;
    const duplicates = Math.max(0, Math.floor(row.duplicates || 0));
    cardStates[row.card_id] = { owned: row.owned || duplicates > 0, duplicates };
  });
  const updatedAt = accountRows.reduce<string | null>((latest, row) => !latest || row.updated_at > latest ? row.updated_at : latest, null);
  return { version: 2, playerName, updatedAt, cards: cardStates, preferences: { category: "all", filter: "all" } };
}

export async function loadAccountCollection(accountId: string, playerName = ""): Promise<RemoteCollectionSnapshot> {
  const userId = await currentUserId();
  await requireOwnedAccount(accountId, userId);
  const { data, error } = await requireSupabase().from("account_cards").select(ACCOUNT_CARD_COLUMNS).eq("account_id", accountId);
  if (error) throw localizedDataError(error, "collectionLoad");
  const collection = rowsToCollection(accountId, playerName, (data ?? []) as AccountCardRow[]);
  return { collection, updatedAt: collection.updatedAt };
}

export async function loadCollectionsForAccounts(accounts: Array<{ id: string; clashNickname: string }>): Promise<Record<string, CollectionData>> {
  if (!accounts.length) return {};
  const accountIds = accounts.map((account) => account.id);
  const { data, error } = await requireSupabase().from("account_cards").select(ACCOUNT_CARD_COLUMNS).in("account_id", accountIds);
  if (error) throw localizedDataError(error, "collectionLoad");
  const rows = (data ?? []) as AccountCardRow[];
  return Object.fromEntries(accounts.map((account) => [account.id, rowsToCollection(account.id, account.clashNickname, rows)]));
}

export async function upsertAccountCard(accountId: string, cardId: string, state: CardState): Promise<void> {
  const userId = await currentUserId();
  await requireOwnedAccount(accountId, userId);
  if (!validCardIds.has(cardId)) throw new Error(i18n.t("invalidCollection", { ns: "errors" }));
  const duplicates = Math.max(0, Math.floor(state.duplicates));
  const { error } = await requireSupabase().from("account_cards").upsert({ account_id: accountId, card_id: cardId, owned: state.owned || duplicates > 0, duplicates, updated_at: new Date().toISOString() }, { onConflict: "account_id,card_id" });
  if (error) throw localizedDataError(error, "sync");
}

export async function deleteAccountCard(accountId: string, cardId: string): Promise<void> {
  const userId = await currentUserId();
  await requireOwnedAccount(accountId, userId);
  const { error } = await requireSupabase().from("account_cards").delete().eq("account_id", accountId).eq("card_id", cardId);
  if (error) throw localizedDataError(error, "sync");
}

export async function replaceAccountCollection(accountId: string, collection: CollectionData): Promise<string> {
  const client = requireSupabase();
  const userId = await currentUserId();
  await requireOwnedAccount(accountId, userId);
  const updatedAt = new Date().toISOString();
  const activeRows = cards.flatMap((card) => {
    const state = collection.cards[card.id];
    if (!state?.owned && !(state?.duplicates > 0)) return [];
    return [{ account_id: accountId, card_id: card.id, owned: Boolean(state.owned || state.duplicates > 0), duplicates: Math.max(0, Math.floor(state.duplicates)), updated_at: updatedAt }];
  });
  const { data: existing, error: readError } = await client.from("account_cards").select("card_id").eq("account_id", accountId);
  if (readError) throw localizedDataError(readError, "sync");
  if (activeRows.length) {
    const { error } = await client.from("account_cards").upsert(activeRows, { onConflict: "account_id,card_id" });
    if (error) throw localizedDataError(error, "sync");
  }
  const activeIds = new Set(activeRows.map((row) => row.card_id));
  const staleIds = ((existing ?? []) as Array<{ card_id: string }>).map((row) => row.card_id).filter((cardId) => !activeIds.has(cardId));
  if (staleIds.length) {
    const { error } = await client.from("account_cards").delete().eq("account_id", accountId).in("card_id", staleIds);
    if (error) throw localizedDataError(error, "sync");
  }
  const [{ error: accountError }, { error: profileError }] = await Promise.all([
    client.from("clash_accounts").update({ updated_at: updatedAt }).eq("id", accountId).eq("owner_id", userId),
    client.from("profiles").update({ last_collection_update: updatedAt, updated_at: updatedAt }).eq("id", userId),
  ]);
  if (accountError || profileError) throw localizedDataError(accountError ?? profileError, "sync");
  return updatedAt;
}

export async function clearAccountCollection(accountId: string): Promise<void> {
  const userId = await currentUserId();
  await requireOwnedAccount(accountId, userId);
  const { error } = await requireSupabase().from("account_cards").delete().eq("account_id", accountId);
  if (error) throw localizedDataError(error, "sync");
}
