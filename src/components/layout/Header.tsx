import { BookOpen, Database, Download, Github, Layers3, LogIn, LogOut, Menu, Shield, UserRound, Users } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { APP_NAME } from "../../constants";
import type { SyncStatus } from "../../types/sync";
import { ProfileAvatar } from "../profile/ProfileAvatar";
import { SyncIndicator } from "../sync/SyncIndicator";
import { Button } from "../ui/Button";
import { LanguageSelector } from "./LanguageSelector";

const CREATOR_URL = "https://github.com/joaopedrobn";

interface HeaderProps {
  collected: number;
  total: number;
  percentage: number;
  accountEnabled: boolean;
  userEmail: string | null;
  profileName: string | null;
  profileNickname: string | null;
  avatarUrl: string | null;
  syncStatus: SyncStatus;
  onRetrySync: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenAccounts: () => void;
  onSignOut: () => void;
  onOpenTransfer: () => void;
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-w-0 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-black transition ${
    isActive
      ? "bg-amber-300/12 text-amber-300"
      : "text-stone-400 hover:bg-white/5 hover:text-white"
  }`;

export function Header(props: HeaderProps) {
  const { t } = useTranslation("common");
  const [accountOpen, setAccountOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <header className="sticky top-0 z-30 max-w-full border-b border-amber-200/10 bg-[#101117]/94 shadow-[0_14px_45px_rgba(0,0,0,.35)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-[1440px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 px-3 py-2.5 sm:px-6 lg:flex lg:flex-nowrap lg:gap-2 lg:px-8 xl:gap-3">
        <NavLink to="/" className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl" aria-label={t("header.goCollection")}>
          {logoFailed
            ? <span className="logo-crest grid size-10 place-items-center"><Shield size={22} fill="currentColor" /></span>
            : <img src="/logo/icon-clash.webp" alt={t("brand.logoAlt")} className="size-full object-contain" onError={() => setLogoFailed(true)} />}
        </NavLink>

        <div className="min-w-0 lg:flex-1">
          <p className="hidden max-w-56 text-[9px] font-black uppercase leading-tight tracking-[.18em] text-amber-400/75 sm:block lg:max-w-none">{t("brand.subtitle")}</p>
          <h1 className="truncate font-display text-sm text-white min-[380px]:text-base sm:text-lg lg:text-xl">{APP_NAME}</h1>
        </div>

        <nav className={`col-span-3 row-start-2 grid w-full ${props.userEmail ? "grid-cols-2" : "grid-cols-1"} gap-1 rounded-2xl border border-white/6 bg-black/15 p-1 lg:order-none lg:flex lg:w-auto lg:shrink-0 lg:border-0 lg:bg-transparent lg:p-0`} aria-label={t("nav.main")}>
          <NavLink to="/" end className={navClass}><BookOpen size={16} aria-hidden="true" /><span>{t("nav.collection")}</span></NavLink>
          {props.userEmail && <NavLink to="/comunidade" className={navClass}><Users size={16} aria-hidden="true" /><span>{t("nav.community")}</span></NavLink>}
        </nav>

        {props.userEmail && (
          <div className="col-span-3 row-start-3 min-w-0 lg:order-none lg:w-auto lg:shrink-0">
            <SyncIndicator status={props.syncStatus} onRetry={props.onRetrySync} />
          </div>
        )}

        <div className="col-start-3 row-start-1 flex min-w-0 items-center justify-end gap-1 sm:gap-2 lg:order-none lg:shrink-0">
          <div className="hidden min-w-40 items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-3 py-2 xl:flex">
            <div className="relative grid size-9 place-items-center rounded-full" style={{ background: `conic-gradient(#f6b83e ${props.percentage * 3.6}deg, #262832 0deg)` }}>
              <div className="grid size-7 place-items-center rounded-full bg-[#171820] text-[9px] font-black text-white">{props.percentage}%</div>
            </div>
            <p className="text-sm font-black text-white">{props.collected}<span className="text-stone-500">/{props.total}</span></p>
          </div>

          <LanguageSelector />

          <button className="icon-button !hidden md:!grid" onClick={props.onOpenTransfer} aria-label={t("header.transfer")}>
            <Download size={18} />
          </button>

          <div className="relative min-[1400px]:hidden">
            <button className="icon-button" onClick={() => setToolsOpen((open) => !open)} aria-label={t("header.tools")} aria-expanded={toolsOpen} aria-haspopup="menu"><Menu size={18} /></button>
            {toolsOpen && (
              <div className="panel-metal absolute -right-[50px] top-12 z-50 w-[min(19rem,calc(100vw-1.5rem))] rounded-2xl p-2 shadow-2xl" role="menu">
                <button role="menuitem" className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-stone-200 hover:bg-white/8 md:hidden" onClick={() => { setToolsOpen(false); props.onOpenTransfer(); }}><Download size={16} /> {t("header.transfer")}</button>
                <a role="menuitem" href={CREATOR_URL} target="_blank" rel="noopener noreferrer" className="flex w-full min-w-0 items-start gap-2 rounded-xl px-3 py-2.5 text-left text-xs text-stone-400 transition hover:bg-white/8 hover:text-amber-300">
                  <Github size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 leading-relaxed"><span>{t("creator.label")}</span>{" "}<span className="break-all">{CREATOR_URL}</span></span>
                </a>
              </div>
            )}
          </div>

          <div className="relative">
            {props.userEmail ? (
              <button className="grid size-[42px] place-items-center rounded-full border border-white/10 bg-white/5 transition hover:bg-white/10" onClick={() => setAccountOpen((open) => !open)} aria-label={t("account.openMenu")} aria-expanded={accountOpen} aria-haspopup="menu">
                <ProfileAvatar avatarUrl={props.avatarUrl} displayName={props.profileName || props.userEmail} size="sm" />
              </button>
            ) : (
              <Button size="sm" variant="secondary" disabled={!props.accountEnabled} onClick={props.onOpenAuth}><LogIn size={15} /><span className="hidden xl:inline">{t("account.signIn")}</span></Button>
            )}

            {accountOpen && props.userEmail && (
              <div className="panel-metal absolute right-0 top-12 z-50 w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl p-3 shadow-2xl" role="menu">
                <div className="flex items-center gap-3 border-b border-white/8 px-2 pb-3">
                  <ProfileAvatar avatarUrl={props.avatarUrl} displayName={props.profileName || props.userEmail} size="md" />
                  <div className="min-w-0"><p className="truncate text-sm font-black text-white">{props.profileName || t("account.myAccount")}</p><p className="truncate text-xs text-stone-400">{props.profileNickname || props.userEmail}</p></div>
                </div>
                <div className="pt-2">
                  <button role="menuitem" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-stone-300 hover:bg-white/6" onClick={() => { setAccountOpen(false); props.onOpenProfile(); }}><UserRound size={16} /> {t("account.editProfile")}</button>
                  <button role="menuitem" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-stone-300 hover:bg-white/6" onClick={() => { setAccountOpen(false); props.onOpenAccounts(); }}><Layers3 size={16} /> {t("account.clashAccounts")}</button>
                  <button role="menuitem" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-stone-300 hover:bg-white/6" onClick={() => { setAccountOpen(false); props.onOpenTransfer(); }}><Database size={16} /> {t("account.collectionData")}</button>
                  <button role="menuitem" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-200 hover:bg-red-400/8" onClick={() => { setAccountOpen(false); props.onSignOut(); }}><LogOut size={16} /> {t("account.signOut")}</button>
                </div>
              </div>
            )}
          </div>

          <div className="hidden min-w-0 items-center gap-1.5 whitespace-nowrap text-[10px] text-stone-500 min-[1400px]:flex">
            <Github size={14} className="shrink-0" aria-hidden="true" />
            <span>{t("creator.label")}</span>
            <a href={CREATOR_URL} target="_blank" rel="noopener noreferrer" className="text-stone-400 transition hover:text-amber-300">{CREATOR_URL}</a>
          </div>
        </div>
      </div>
    </header>
  );
}
