import type { ProfileInput } from "../types/profile";
import i18n from "../i18n";
import { isAllowedAvatarUrl, PROFILE_AVATARS } from "../data/avatars";

export function normalizeClashTag(value: string, required = false): string {
  const normalized = value.replace(/\s+/g, "").toUpperCase().replace(/^#+/, "");
  if (!normalized) {
    if (required) throw new Error(i18n.t("validation.playerTagRequired", { ns: "profile" }));
    return "";
  }
  const tag = `#${normalized}`;
  if (!/^#[A-Z0-9]{5,14}$/.test(tag)) {
    throw new Error(i18n.t("validation.tagInvalid", { ns: "profile" }));
  }
  return tag;
}

export function validateProfile(input: ProfileInput): ProfileInput {
  const displayName = input.displayName.trim();
  const clashNickname = input.clashNickname.trim();
  const clanName = input.clanName.trim();
  const bio = input.bio.trim();
  if (displayName.length < 2 || displayName.length > 40) throw new Error(i18n.t("validation.displayName", { ns: "profile" }));
  if (clashNickname.length < 1 || clashNickname.length > 40) throw new Error(i18n.t("validation.nickname", { ns: "profile" }));
  if (clanName.length > 50) throw new Error(i18n.t("validation.clanName", { ns: "profile" }));
  if (bio.length > 240) throw new Error(i18n.t("validation.bio", { ns: "profile" }));
  if (PROFILE_AVATARS.length && !isAllowedAvatarUrl(input.avatarUrl)) throw new Error(i18n.t("validation.avatarRequired", { ns: "profile" }));
  if (!PROFILE_AVATARS.length && input.avatarUrl !== null) throw new Error(i18n.t("validation.avatarInvalid", { ns: "profile" }));
  return {
    ...input,
    displayName,
    clashNickname,
    clashPlayerTag: normalizeClashTag(input.clashPlayerTag, true),
    clanName,
    clanTag: normalizeClashTag(input.clanTag),
    bio,
    avatarUrl: isAllowedAvatarUrl(input.avatarUrl) ? input.avatarUrl : null,
  };
}
