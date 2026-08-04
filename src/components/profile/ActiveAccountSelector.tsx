import { Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { ClashAccountsState } from "../../hooks/useClashAccounts";
import { ProfileAvatar } from "./ProfileAvatar";
import { AccountDropdown } from "./AccountDropdown";

export function ActiveAccountSelector({ state }: { state: ClashAccountsState }) {
  const { t } = useTranslation("profile");
  if (!state.accounts.length || !state.activeAccount) return null;
  return <section className="panel-metal grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-end gap-x-3 gap-y-2 rounded-2xl p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-4">
    <span className="col-span-2 block text-[10px] font-black uppercase tracking-wider text-stone-500 sm:hidden">{t("accounts.current")}</span>
    <span className="shrink-0 self-end"><ProfileAvatar avatarUrl={state.activeAccount.avatarUrl} displayName={state.activeAccount.clashNickname} size="sm" /></span>
    <div className="min-w-0"><span className="mb-1 hidden text-[10px] font-black uppercase tracking-wider text-stone-500 sm:block">{t("accounts.current")}</span><AccountDropdown accounts={state.accounts} value={state.activeClashAccountId ?? ""} onChange={state.setActiveClashAccountId} ariaLabel={t("accounts.current")} testId="active-account-dropdown" /></div>
    <Link to="/contas" className="col-span-2 inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 self-end rounded-xl border border-white/10 px-4 text-xs font-black text-stone-300 transition hover:bg-white/5 hover:text-white sm:col-span-1 sm:w-auto"><Settings2 size={15} />{t("accounts.manage")}</Link>
  </section>;
}
