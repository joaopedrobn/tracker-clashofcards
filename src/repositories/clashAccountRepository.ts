import i18n from "../i18n";
import { isAllowedAvatarUrl, PROFILE_AVATARS } from "../data/avatars";
import { requireSupabase } from "../lib/supabase";
import { localizedDataError } from "../services/dataError";
import { validateClashAccount } from "../services/clashAccountService";
import type { ClashAccount, ClashAccountInput } from "../types/clashAccount";
import { MAX_CLASH_ACCOUNTS } from "../services/clashAccountState";

export const MAX_FREE_CLASH_ACCOUNTS = MAX_CLASH_ACCOUNTS;

export interface ClashAccountRow {
  id: string;
  owner_id: string;
  account_label: string;
  clash_nickname: string;
  clash_player_tag: string;
  clan_name: string | null;
  clan_tag: string | null;
  avatar_url: string | null;
  is_primary: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const CLASH_ACCOUNT_COLUMNS = "id,owner_id,account_label,clash_nickname,clash_player_tag,clan_name,clan_tag,avatar_url,is_primary,display_order,created_at,updated_at";

export function mapClashAccount(row: ClashAccountRow): ClashAccount {
  return {
    id: row.id,
    ownerId: row.owner_id,
    accountLabel: row.account_label,
    clashNickname: row.clash_nickname,
    clashPlayerTag: row.clash_player_tag,
    clanName: row.clan_name,
    clanTag: row.clan_tag,
    avatarUrl: row.avatar_url,
    isPrimary: row.is_primary,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function currentUserId(): Promise<string> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error(i18n.t("sessionExpired", { ns: "errors" }));
  return data.user.id;
}

function accountError(error: { code?: string; message?: string } | null | undefined): Error {
  const message = error?.message ?? "";
  if (message.includes("FREE_CLASH_ACCOUNT_LIMIT_REACHED")) return new Error(i18n.t("accounts.errors.limit", { ns: "profile" }));
  if (message.includes("LAST_CLASH_ACCOUNT_CANNOT_BE_DELETED")) return new Error(i18n.t("accounts.errors.lastAccount", { ns: "profile" }));
  if (message.includes("CLASH_ACCOUNT_NOT_FOUND")) return new Error(i18n.t("accounts.errors.notFound", { ns: "profile" }));
  if (error?.code === "23505") return new Error(i18n.t("accounts.errors.duplicateTag", { ns: "profile" }));
  return localizedDataError(error);
}

async function requireOwnedAccount(accountId: string, ownerId: string): Promise<ClashAccountRow> {
  const { data, error } = await requireSupabase().from("clash_accounts").select(CLASH_ACCOUNT_COLUMNS).eq("id", accountId).eq("owner_id", ownerId).maybeSingle();
  if (error) throw accountError(error);
  if (!data) throw new Error(i18n.t("accounts.errors.notFound", { ns: "profile" }));
  return data as ClashAccountRow;
}

export async function listMyClashAccounts(): Promise<ClashAccount[]> {
  const userId = await currentUserId();
  const { data, error } = await requireSupabase().from("clash_accounts").select(CLASH_ACCOUNT_COLUMNS).eq("owner_id", userId).order("display_order").order("created_at");
  if (error) throw accountError(error);
  return ((data ?? []) as ClashAccountRow[]).map(mapClashAccount);
}

export async function getClashAccountById(accountId: string): Promise<ClashAccount | null> {
  const userId = await currentUserId();
  const { data, error } = await requireSupabase().from("clash_accounts").select(CLASH_ACCOUNT_COLUMNS).eq("id", accountId).eq("owner_id", userId).maybeSingle();
  if (error) throw accountError(error);
  return data ? mapClashAccount(data as ClashAccountRow) : null;
}

export async function createClashAccount(input: ClashAccountInput): Promise<ClashAccount> {
  const client = requireSupabase();
  const userId = await currentUserId();
  const normalized = validateClashAccount(input);
  const { count, error: countError } = await client.from("clash_accounts").select("id", { count: "exact", head: true }).eq("owner_id", userId);
  if (countError) throw accountError(countError);
  if ((count ?? 0) >= MAX_FREE_CLASH_ACCOUNTS) throw new Error(i18n.t("accounts.errors.limit", { ns: "profile" }));
  const payload = {
    owner_id: userId,
    account_label: normalized.accountLabel,
    clash_nickname: normalized.clashNickname,
    clash_player_tag: normalized.clashPlayerTag,
    clan_name: normalized.clanName || null,
    clan_tag: normalized.clanTag || null,
    avatar_url: isAllowedAvatarUrl(normalized.avatarUrl) ? normalized.avatarUrl : null,
    is_primary: (count ?? 0) === 0,
    display_order: count ?? 0,
  };
  const { data, error } = await client.from("clash_accounts").insert(payload).select(CLASH_ACCOUNT_COLUMNS).single();
  if (error) throw accountError(error);
  return mapClashAccount(data as ClashAccountRow);
}

export async function updateClashAccount(accountId: string, input: ClashAccountInput): Promise<ClashAccount> {
  const client = requireSupabase();
  const userId = await currentUserId();
  await requireOwnedAccount(accountId, userId);
  const normalized = validateClashAccount(input);
  if (PROFILE_AVATARS.length && !isAllowedAvatarUrl(normalized.avatarUrl)) throw new Error(i18n.t("validation.avatarRequired", { ns: "profile" }));
  const { data, error } = await client.from("clash_accounts").update({
    account_label: normalized.accountLabel,
    clash_nickname: normalized.clashNickname,
    clash_player_tag: normalized.clashPlayerTag,
    clan_name: normalized.clanName || null,
    clan_tag: normalized.clanTag || null,
    avatar_url: normalized.avatarUrl,
    updated_at: new Date().toISOString(),
  }).eq("id", accountId).eq("owner_id", userId).select(CLASH_ACCOUNT_COLUMNS).single();
  if (error) throw accountError(error);
  return mapClashAccount(data as ClashAccountRow);
}

export async function deleteClashAccount(accountId: string): Promise<void> {
  const userId = await currentUserId();
  await requireOwnedAccount(accountId, userId);
  const { error } = await requireSupabase().rpc("delete_own_clash_account", { p_account_id: accountId });
  if (error) throw accountError(error);
}

export async function setPrimaryClashAccount(accountId: string): Promise<void> {
  const userId = await currentUserId();
  await requireOwnedAccount(accountId, userId);
  const { error } = await requireSupabase().rpc("set_primary_clash_account", { p_account_id: accountId });
  if (error) throw accountError(error);
}

export async function reorderClashAccounts(accountIds: string[]): Promise<void> {
  const client = requireSupabase();
  const userId = await currentUserId();
  const current = await listMyClashAccounts();
  const ownedIds = new Set(current.map((account) => account.id));
  if (accountIds.length !== current.length || accountIds.some((id) => !ownedIds.has(id))) throw new Error(i18n.t("accounts.errors.invalidOrder", { ns: "profile" }));
  const results = await Promise.all(accountIds.map((id, displayOrder) => client.from("clash_accounts").update({ display_order: displayOrder }).eq("id", id).eq("owner_id", userId)));
  const failed = results.find((result) => result.error);
  if (failed?.error) throw accountError(failed.error);
}

export async function listPublicClashAccountsByOwner(ownerId: string): Promise<ClashAccount[]> {
  const { data, error } = await requireSupabase().from("clash_accounts").select(CLASH_ACCOUNT_COLUMNS).eq("owner_id", ownerId).order("display_order").order("created_at");
  if (error) throw accountError(error);
  return ((data ?? []) as ClashAccountRow[]).map(mapClashAccount);
}

export async function listPublicClashAccountsByOwners(ownerIds: string[]): Promise<ClashAccount[]> {
  if (!ownerIds.length) return [];
  const { data, error } = await requireSupabase().from("clash_accounts").select(CLASH_ACCOUNT_COLUMNS).in("owner_id", ownerIds).order("display_order");
  if (error) throw accountError(error);
  return ((data ?? []) as ClashAccountRow[]).map(mapClashAccount);
}
