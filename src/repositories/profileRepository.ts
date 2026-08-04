import { requireSupabase } from "../lib/supabase";
import i18n from "../i18n";
import { localizedDataError } from "../services/dataError";
import type { ProfileInput, PublicProfile } from "../types/profile";
import { isAllowedAvatarUrl, PROFILE_AVATARS } from "../data/avatars";

export interface ProfileRow {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  last_collection_update: string | null;
}

const PROFILE_COLUMNS = "id,display_name,bio,avatar_url,is_public,created_at,updated_at,last_collection_update";

export function mapProfile(row: ProfileRow): PublicProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastCollectionUpdate: row.last_collection_update,
  };
}

async function currentUserId(): Promise<string> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error(i18n.t("sessionExpired", { ns: "errors" }));
  return data.user.id;
}

export async function fetchOwnProfile(): Promise<PublicProfile | null> {
  const client = requireSupabase();
  const userId = await currentUserId();
  const { data, error } = await client.from("profiles").select(PROFILE_COLUMNS).eq("id", userId).maybeSingle();
  if (error) throw localizedDataError(error, "profileLoad");
  return data ? mapProfile(data as ProfileRow) : null;
}

export async function saveOwnProfile(input: ProfileInput): Promise<PublicProfile> {
  const client = requireSupabase();
  const userId = await currentUserId();
  if (PROFILE_AVATARS.length && !isAllowedAvatarUrl(input.avatarUrl)) {
    throw new Error(i18n.t("validation.avatarRequired", { ns: "profile" }));
  }
  const payload = {
    id: userId,
    display_name: input.displayName.trim(),
    bio: input.bio.trim() || null,
    avatar_url: isAllowedAvatarUrl(input.avatarUrl) ? input.avatarUrl : null,
    is_public: input.isPublic,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await client
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select(PROFILE_COLUMNS)
    .single();
  if (error) {
    if (error.code === "23505") throw new Error(i18n.t("validation.duplicateTag", { ns: "profile" }));
    throw localizedDataError(error);
  }
  return mapProfile(data as ProfileRow);
}

export async function fetchPublicProfile(profileId: string): Promise<PublicProfile | null> {
  const { data, error } = await requireSupabase()
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", profileId)
    .eq("is_public", true)
    .maybeSingle();
  if (error) throw localizedDataError(error, "profileLoad");
  return data ? mapProfile(data as ProfileRow) : null;
}

export { PROFILE_COLUMNS };
