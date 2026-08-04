import { ArrowDownToLine, ArrowUpFromLine, Copy, Search, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { ProfileAvatar } from "../components/profile/ProfileAvatar";
import { isSupabaseEnabled } from "../lib/supabase";
import { fetchCommunityPage } from "../repositories/communityRepository";
import { calculateSelectedAccountTradeSummary } from "../services/tradeComparison";
import { chooseActiveClashAccount } from "../services/clashAccountState";
import { loadCollectionsForAccounts } from "../repositories/accountCollectionRepository";
import type { CollectionData } from "../types/collection";
import type { ClashAccountsState } from "../hooks/useClashAccounts";
import type { CommunitySort, PublicPlayer } from "../types/profile";
import { copyToClipboard } from "../utils/clipboard";
import { AccountDropdown } from "../components/profile/AccountDropdown";

const PAGE_SIZE = 20;
interface Props { accountsState: ClashAccountsState; myActiveCollection: CollectionData; }

export function CommunityPage({ accountsState, myActiveCollection }: Props) {
  const { t } = useTranslation(["community", "common"]);
  const [search, setSearch] = useState(""); const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CommunitySort>("recent"); const [page, setPage] = useState(1);
  const [players, setPlayers] = useState<PublicPlayer[]>([]); const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const [myCollections, setMyCollections] = useState<Record<string, CollectionData>>({});
  const [selectedOtherAccounts, setSelectedOtherAccounts] = useState<Record<string, string>>({});
  const myAccounts = accountsState.accounts;
  const ownClanTag = myAccounts.find((account) => account.isPrimary)?.clanTag ?? myAccounts[0]?.clanTag;
  const accountQueryKey = myAccounts.map((account) => `${account.id}:${account.clanTag ?? ""}`).join("|");
  const loadErrorText = t("community:loadError");

  useEffect(() => { let active = true; if (!myAccounts.length) { setMyCollections({}); return; } void loadCollectionsForAccounts(myAccounts).then((value) => { if (active) setMyCollections(value); }).catch(() => undefined); return () => { active = false; }; }, [myAccounts]);

  useEffect(() => { const timeout = window.setTimeout(() => { setPage(1); setQuery(search); }, 350); return () => window.clearTimeout(timeout); }, [search]);
  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    let active = true; setLoading(true); setError("");
    void fetchCommunityPage({ search: query, sort, page, pageSize: PAGE_SIZE, clanTag: ownClanTag }).then((result) => { if (!active) return; setPlayers(result.players); setTotal(result.total); }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : loadErrorText); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [accountQueryKey, loadErrorText, ownClanTag, page, query, sort]);

  const effectiveMyCollections = accountsState.activeClashAccountId ? { ...myCollections, [accountsState.activeClashAccountId]: myActiveCollection } : myCollections;
  const comparisonAccount = accountsState.activeAccount;

  return <PageContainer><div className="space-y-5 pt-6">
    <div><p className="text-xs font-black uppercase tracking-[.2em] text-amber-400">{t("community:eyebrow")}</p><h2 className="font-display text-3xl text-white">{t("community:title")}</h2><p className="mt-2 max-w-2xl text-sm text-stone-400">{t("community:description")}</p></div>
    {!isSupabaseEnabled() ? <Notice text={t("community:notConfigured")} /> : <>
      <div className="panel-metal grid min-w-0 gap-3 rounded-2xl p-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,auto)]"><div className="min-w-0 sm:col-span-2"><span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-stone-500">{t("community:myAccountForComparison")}</span>{comparisonAccount && <AccountDropdown accounts={myAccounts} value={comparisonAccount.id} onChange={accountsState.setActiveClashAccountId} ariaLabel={t("community:myAccountForComparison")} testId="community-account-dropdown" />}</div><label className="input-wrapper min-w-0"><Search className="input-icon" size={17} aria-hidden="true" /><input className="field input-with-icon h-12 w-full" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("community:search")} aria-label={t("community:search")} /></label><select className="field h-12 min-w-0 w-full" value={sort} onChange={(event) => { setSort(event.target.value as CommunitySort); setPage(1); }} aria-label={t("community:sortLabel")}><option value="recent">{t("community:sorts.recent")}</option><option value="progress">{t("community:sorts.progress")}</option><option value="duplicates">{t("community:sorts.duplicates")}</option><option value="same-clan" disabled={!myAccounts.some((account) => account.clanTag)}>{t("community:sorts.sameClan")}</option></select></div>
      {error ? <Notice text={error} /> : loading ? <Notice text={t("community:loading")} /> : players.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{players.map((player) => {
        const selectedOtherAccount = chooseActiveClashAccount(player.accounts, selectedOtherAccounts[player.id] ?? null);
        return <PlayerCard key={player.id} player={player} selectedMyAccountId={accountsState.activeClashAccountId} selectedMyAccountLabel={comparisonAccount?.accountLabel ?? ""} selectedOtherAccountId={selectedOtherAccount?.id ?? null} myCollections={effectiveMyCollections} onSelectedOtherAccountChange={(accountId) => setSelectedOtherAccounts((current) => ({ ...current, [player.id]: accountId }))} />;
      })}</div> : <Notice text={t("community:empty")} />}
      <div className="flex items-center justify-between"><p className="text-xs text-stone-500">{t("community:playerCount", { count: total })}</p><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={page === 1 || loading} onClick={() => setPage((value) => value - 1)}>{t("common:actions.previous")}</Button><span className="grid min-w-10 place-items-center text-xs font-black text-stone-300">{page}</span><Button variant="secondary" size="sm" disabled={page * PAGE_SIZE >= total || loading} onClick={() => setPage((value) => value + 1)}>{t("common:actions.next")}</Button></div></div>
    </>}
  </div></PageContainer>;
}

function PlayerCard({ player, selectedMyAccountId, selectedMyAccountLabel, selectedOtherAccountId, myCollections, onSelectedOtherAccountChange }: { player: PublicPlayer; selectedMyAccountId: string | null; selectedMyAccountLabel: string; selectedOtherAccountId: string | null; myCollections: Record<string, CollectionData>; onSelectedOtherAccountChange: (accountId: string) => void }) {
  const { t, i18n } = useTranslation("community");
  const selectedOtherAccount = player.accounts.find((account) => account.id === selectedOtherAccountId) ?? null;
  const opportunities = calculateSelectedAccountTradeSummary(selectedMyAccountId, myCollections, selectedOtherAccountId, player.collections);
  const hasBio = Boolean(player.bio?.trim());
  const comparePath = buildComparePath(player.id, selectedMyAccountId, selectedOtherAccountId);
  return <article className="panel-metal rounded-2xl p-4 transition hover:-translate-y-0.5 hover:border-amber-300/25"><div className="flex items-start gap-3"><ProfileAvatar avatarUrl={player.avatarUrl} displayName={player.displayName} size="md" /><div className="min-w-0 flex-1"><h3 className="truncate font-black text-white">{player.displayName}</h3>{player.primaryAccount && <><p className="truncate text-xs text-stone-400">{player.primaryAccount.clashNickname} · {player.primaryAccount.clashPlayerTag}</p><p className="mt-1 truncate text-xs text-stone-500">{t("clan", { name: player.primaryAccount.clanName || t("noClan") })}{player.primaryAccount.clanTag ? ` · ${player.primaryAccount.clanTag}` : ""}</p></>}<p className="mt-1 text-[11px] font-bold text-amber-300/80">{t("accountCount", { count: player.accountCount })}</p>{hasBio ? <p className="mt-2 line-clamp-2 max-w-full whitespace-pre-line break-words text-[11px] leading-relaxed text-stone-400 [overflow-wrap:anywhere]">{player.bio}</p> : null}</div></div>
    {player.accounts.length > 1 && selectedOtherAccount && <div className="mt-3 min-w-0"><span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-stone-500">{t("accountToCompare")}</span><AccountDropdown accounts={player.accounts} value={selectedOtherAccount.id} onChange={onSelectedOtherAccountChange} ariaLabel={t("accountToCompareFor", { name: player.displayName })} testId={`community-other-account-${player.id}`} /></div>}
    <div className="mt-4 grid grid-cols-2 gap-2 min-[380px]:grid-cols-4"><Stat value={`${player.summary.collected}/60`} label={t("metrics.cards")} /><Stat value={player.summary.missing} label={t("metrics.missing")} /><Stat value={player.summary.duplicateTypes} label={t("metrics.duplicateTypes")} /><Stat value={player.summary.duplicateCopies} label={t("metrics.duplicates")} /></div>
    <div className="mt-3 rounded-2xl border border-emerald-300/12 bg-emerald-300/5 p-3"><div className="mb-2 flex min-w-0 flex-wrap items-baseline justify-between gap-x-2"><p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">{t("trades.title")}</p>{selectedMyAccountLabel && <p className="max-w-full truncate text-[9px] text-stone-500" title={selectedMyAccountLabel}>{t("comparingWith", { name: selectedMyAccountLabel })}</p>}</div><div className="grid grid-cols-2 gap-2"><TradeStat icon={ArrowDownToLine} value={opportunities.theyCanOfferCount} label={t("trades.theyCanOffer")} /><TradeStat icon={ArrowUpFromLine} value={opportunities.iCanOfferCount} label={t("trades.iCanOffer")} /></div></div>
    <p className="mt-3 text-[10px] text-stone-500">{t("updated", { relative: relativeDate(player.lastCollectionUpdate, i18n.language, t("notUpdated")) })}</p><div className="mt-3 flex gap-2"><Link to={comparePath} className="inline-flex min-h-9 min-w-0 flex-1 items-center justify-center rounded-xl border border-amber-300/40 bg-amber-300 px-3 text-center text-xs font-black text-stone-950">{t("viewCompare")}</Link>{selectedOtherAccount && <Button size="sm" variant="secondary" aria-label={t("copySelectedTag", { account: selectedOtherAccount.accountLabel, name: player.displayName })} onClick={() => void copyToClipboard(selectedOtherAccount.clashPlayerTag)}><Copy size={14} /></Button>}</div></article>;
}
function buildComparePath(profileId: string, myAccountId: string | null, theirAccountId: string | null): string { const params = new URLSearchParams(); if (myAccountId) params.set("myAccount", myAccountId); if (theirAccountId) params.set("theirAccount", theirAccountId); const query = params.toString(); return `/jogador/${profileId}${query ? `?${query}` : ""}`; }
function Stat({ value, label }: { value: string | number; label: string }) { return <div className="rounded-xl bg-black/20 p-2 text-center"><strong className="block text-sm text-white">{value}</strong><small className="text-[10px] uppercase text-stone-500">{label}</small></div>; }
function TradeStat({ icon: Icon, value, label }: { icon: typeof ArrowDownToLine; value: number; label: string }) { return <div className="flex items-center gap-2 rounded-xl bg-black/20 p-2"><Icon size={16} className="shrink-0 text-emerald-300" aria-hidden="true" /><div><strong className="block text-base text-white">{value}</strong><small className="block text-[9px] font-bold leading-tight text-stone-400">{label}</small></div></div>; }
function Notice({ text }: { text: string }) { return <div className="panel-metal grid min-h-36 place-items-center rounded-2xl p-6 text-center text-sm text-stone-400"><div><Users className="mx-auto mb-3 text-stone-600" aria-hidden="true" /><p>{text}</p></div></div>; }
function relativeDate(value: string | null, language: string, fallback: string) { if (!value) return fallback; const difference = new Date(value).getTime() - Date.now(); const minutes = Math.round(difference / 60000); const formatter = new Intl.RelativeTimeFormat(language, { numeric: "auto" }); if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute"); const hours = Math.round(minutes / 60); if (Math.abs(hours) < 24) return formatter.format(hours, "hour"); return formatter.format(Math.round(hours / 24), "day"); }
