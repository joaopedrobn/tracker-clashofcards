import { requireSupabase } from "../lib/supabase";
import { localizedDataError } from "../services/dataError";
import type { CollectionData } from "../types/collection";
import type { CommunityResult, CommunitySort, PublicPlayer } from "../types/profile";
import { summarizeCollection } from "../services/collectionSummary";
import { mapProfile, PROFILE_COLUMNS, type ProfileRow } from "./profileRepository";
import { USER_CARD_COLUMNS, type UserCardRow } from "./collectionRepository";

interface CommunityParams {
  search: string;
  sort: CommunitySort;
  page: number;
  pageSize: number;
  clanTag?: string | null;
}

function safeSearch(value: string): string {
  return value.trim().replace(/^#/, "").replace(/[^\p{L}\p{N} #_-]/gu, "").replace(/\s+/g, " ").slice(0, 60);
}

export async function fetchCommunityPage(params: CommunityParams): Promise<CommunityResult> {
  const client = requireSupabase();
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;
  let query = client
    .from("profiles")
    .select(PROFILE_COLUMNS, { count: "exact" })
    .eq("is_public", true);

  const search = safeSearch(params.search);
  if (search) {
    const pattern = `%${search}%`;
    query = query.or([
      `display_name.ilike.${pattern}`,
      `clash_nickname.ilike.${pattern}`,
      `clash_player_tag.ilike.${pattern}`,
      `clash_player_tag.ilike.%#${search}%`,
      `clan_name.ilike.${pattern}`,
      `clan_tag.ilike.${pattern}`,
      `clan_tag.ilike.%#${search}%`,
    ].join(","));
  }
  if (params.sort === "same-clan" && params.clanTag) query = query.eq("clan_tag", params.clanTag);
  query = query.order("last_collection_update", { ascending: false, nullsFirst: false }).range(from, to);

  const { data: profileRows, error, count } = await query;
  if (error) throw localizedDataError(error);
  const profiles = ((profileRows ?? []) as ProfileRow[]).map(mapProfile);
  if (!profiles.length) return { players: [], total: count ?? 0 };

  const profileIds = profiles.map((profile) => profile.id);
  const { data: cardRows, error: cardError } = await client
    .from("user_cards")
    .select(USER_CARD_COLUMNS)
    .in("user_id", profileIds);
  if (cardError) throw localizedDataError(cardError);

  const grouped = new Map<string, Record<string, { owned: boolean; duplicates: number }>>();
  ((cardRows ?? []) as UserCardRow[]).forEach((row) => {
    const userCards = grouped.get(row.user_id) ?? {};
    userCards[row.card_id] = { owned: row.owned || row.duplicates > 0, duplicates: Math.max(0, row.duplicates) };
    grouped.set(row.user_id, userCards);
  });

  const players: PublicPlayer[] = profiles.map((profile) => {
    const collection: CollectionData = {
      version: 2,
      playerName: profile.displayName,
      updatedAt: profile.lastCollectionUpdate,
      cards: grouped.get(profile.id) ?? {},
      preferences: { category: "all", filter: "all" },
    };
    return { ...profile, summary: summarizeCollection(collection), collection };
  });

  if (params.sort === "progress") players.sort((a, b) => b.summary.collected - a.summary.collected);
  if (params.sort === "duplicates") players.sort((a, b) => b.summary.duplicateCopies - a.summary.duplicateCopies);
  return { players, total: count ?? 0 };
}
