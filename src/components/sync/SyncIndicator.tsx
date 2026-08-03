import { Check, Cloud, CloudOff, LoaderCircle, RefreshCw, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { SyncStatus } from "../../types/sync";

export function SyncIndicator({ status, onRetry }: { status: SyncStatus; onRetry: () => void }) {
  const { t } = useTranslation("common");
  const label = t(`sync.${status}`);
  const Icon = status === "synced"
    ? Check
    : status === "offline"
      ? CloudOff
      : status === "error"
        ? TriangleAlert
        : status === "syncing" || status === "loading"
          ? LoaderCircle
          : Cloud;
  const actionable = status === "error" || status === "offline";
  const className = `inline-flex min-h-8 w-full min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[10px] font-black uppercase leading-tight tracking-wide lg:w-auto ${
    actionable
      ? "border-red-300/20 bg-red-400/8 text-red-200 hover:bg-red-400/12"
      : "border-white/8 bg-white/5 text-stone-400"
  }`;
  const contents = <><Icon size={13} className={`shrink-0 ${status === "syncing" || status === "loading" ? "animate-spin" : ""}`} aria-hidden="true" /><span className="min-w-0">{label}</span>{actionable && <RefreshCw size={12} className="shrink-0" aria-hidden="true" />}</>;

  if (actionable) {
    return <button type="button" onClick={onRetry} className={className} title={`${label}. ${t("sync.retry")}`} aria-label={`${label}. ${t("sync.retry")}`}>{contents}</button>;
  }

  return <div className={className} role="status" aria-live="polite" title={label}>{contents}</div>;
}
