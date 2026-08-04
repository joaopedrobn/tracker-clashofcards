import i18n from "../i18n";
import { isAllowedAvatarUrl, PROFILE_AVATARS } from "../data/avatars";
import type { ClashAccountInput } from "../types/clashAccount";
import { normalizeClashTag } from "./profileService";

export function validateClashAccount(input: ClashAccountInput): ClashAccountInput {
  const accountLabel = input.accountLabel.trim();
  const clashNickname = input.clashNickname.trim();
  const clanName = input.clanName.trim();
  if (!accountLabel || accountLabel.length > 40) throw new Error(i18n.t("accounts.validation.label", { ns: "profile" }));
  if (!clashNickname || clashNickname.length > 40) throw new Error(i18n.t("accounts.validation.nickname", { ns: "profile" }));
  if (clanName.length > 50) throw new Error(i18n.t("accounts.validation.clanName", { ns: "profile" }));
  if (PROFILE_AVATARS.length && !isAllowedAvatarUrl(input.avatarUrl)) throw new Error(i18n.t("validation.avatarRequired", { ns: "profile" }));
  return {
    ...input,
    accountLabel,
    clashNickname,
    clashPlayerTag: normalizeClashTag(input.clashPlayerTag, true),
    clanName,
    clanTag: normalizeClashTag(input.clanTag),
    avatarUrl: isAllowedAvatarUrl(input.avatarUrl) ? input.avatarUrl : null,
  };
}
