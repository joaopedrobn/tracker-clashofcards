import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAvatarByUrl } from "../../data/avatars";

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  displayName: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "size-9 text-sm",
  md: "size-12 text-lg",
  lg: "size-16 text-2xl",
  xl: "size-24 text-3xl",
};

export function ProfileAvatar({ avatarUrl, displayName, size = "md", className = "" }: ProfileAvatarProps) {
  const { t } = useTranslation("profile");
  const avatar = getAvatarByUrl(avatarUrl);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [avatar?.image]);
  const initial = displayName.trim().charAt(0).toLocaleUpperCase() || "?";
  const baseClass = `grid shrink-0 place-items-center overflow-hidden rounded-full border border-amber-200/20 bg-gradient-to-br from-amber-300/25 to-violet-500/20 font-display font-black text-amber-100 shadow-inner ${sizes[size]} ${className}`;

  if (!avatar || failed) {
    return <span className={baseClass} role="img" aria-label={t("avatarFallback", { name: displayName || t("profileAvatar") })}>{initial}</span>;
  }

  return <span className={baseClass}><img className="size-full object-cover" src={avatar.image} alt={t("avatarOf", { name: displayName || t("profileAvatar") })} onError={() => setFailed(true)} /></span>;
}
