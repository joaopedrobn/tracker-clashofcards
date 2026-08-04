import { requireSupabase } from "../lib/supabase";
import { localizedDataError } from "../services/dataError";
import { summarizeCollection } from "../services/collectionSummary";
import type { CommunityResult, CommunitySort, PublicPlayer } from "../types/profile";
import { loadCollectionsForAccounts } from "./accountCollectionRepository";
import { CLASH_ACCOUNT_COLUMNS, listPublicClashAccountsByOwners, type ClashAccountRow } from "./clashAccountRepository";
import { mapProfile, PROFILE_COLUMNS, type ProfileRow } from "./profileRepository";

interface CommunityParams { search: string; sort: CommunitySort; page: number; pageSize: number; clanTag?: string | null; }

function safeSearch(value: string): string { return value.trim().replace(/^#/, "").replace(/[^\p{L}\p{N} #_-]/gu, "").replace(/\s+/g, " ").slice(0, 60); }

async function matchingAccountOwners(search: string, clanTag?: string | null): Promise<string[] | null> {
  if (!search && !clanTag) return null;
  let query = requireSupabase().from("clash_accounts").select(CLASH_ACCOUNT_COLUMNS);
  if (clanTag) query = query.eq("clan_tag", clanTag);
  if (search) {
    const pattern = `%${search}%`;
    query = query.or([`account_label.ilike.${pattern}`, `clash_nickname.ilike.${pattern}`, `clash_player_tag.ilike.${pattern}`, `clash_player_tag.ilike.%#${search}%`, `clan_name.ilike.${pattern}`, `clan_tag.ilike.${pattern}`, `clan_tag.ilike.%#${search}%`].join(","));
  }
  const { data, error } = await query;
  if (error) throw localizedDataError(error, "collectionLoad");
  return [...new Set(((data ?? []) as ClashAccountRow[]).map((row) => row.owner_id))];
}

export async function fetchCommunityPage(params: CommunityParams): Promise<CommunityResult> {
  const client = requireSupabase();
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;
  const search = safeSearch(params.search);
  const accountOwnerIds = await matchingAccountOwners(search, params.sort === "same-clan" ? params.clanTag : null);
  if (params.sort === "same-clan" && accountOwnerIds?.length === 0) return { players: [], total: 0 };
  let query = client.from("profiles").select(PROFILE_COLUMNS, { count: "exact" }).eq("is_public", true);
  if (params.sort === "same-clan" && accountOwnerIds) query = query.in("id", accountOwnerIds);
  else if (search) {
    const pattern = `%${search}%`;
    const accountFilter = accountOwnerIds?.length ? `,id.in.(${accountOwnerIds.join(",")})` : "";
    query = query.or(`display_name.ilike.${pattern}${accountFilter}`);
  }
  query = query.order("last_collection_update", { ascending: false, nullsFirst: false }).range(from, to);
  const { data: profileRows, error, count } = await query;
  if (error) throw localizedDataError(error);
  const profiles = ((profileRows ?? []) as ProfileRow[]).map(mapProfile);
  if (!profiles.length) return { players: [], total: count ?? 0 };

  const accounts = await listPublicClashAccountsByOwners(profiles.map((profile) => profile.id));
  const collections = await loadCollectionsForAccounts(accounts);
  const accountsByOwner = new Map<string, typeof accounts>();
  accounts.forEach((account) => accountsByOwner.set(account.ownerId, [...(accountsByOwner.get(account.ownerId) ?? []), account]));
  const players: PublicPlayer[] = profiles.map((profile) => {
    const playerAccounts = accountsByOwner.get(profile.id) ?? [];
    const primaryAccount = playerAccounts.find((account) => account.isPrimary) ?? playerAccounts[0] ?? null;
    const collection = primaryAccount ? collections[primaryAccount.id] : { version: 2 as const, playerName: profile.displayName, updatedAt: null, cards: {}, preferences: { category: "all" as const, filter: "all" as const } };
    return { ...profile, accounts: playerAccounts, primaryAccount, accountCount: playerAccounts.length, collection, collections: Object.fromEntries(playerAccounts.map((account) => [account.id, collections[account.id]])), summary: summarizeCollection(collection) };
  });
  if (params.sort === "progress") players.sort((a, b) => b.summary.collected - a.summary.collected);
  if (params.sort === "duplicates") players.sort((a, b) => b.summary.duplicateCopies - a.summary.duplicateCopies);
  return { players, total: count ?? 0 };
}
