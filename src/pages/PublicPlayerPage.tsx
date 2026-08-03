import { ArrowLeft, Copy, Swords } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { CardGrid } from "../components/collection/CardGrid";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { cards } from "../data/cards";
import { categories } from "../data/categories";
import { fetchPublicCollection } from "../repositories/collectionRepository";
import { fetchPublicProfile } from "../repositories/profileRepository";
import { generateTradeProposal } from "../services/publicTradeComparison";
import { compareCollections } from "../services/tradeComparison";
import type { CardFilter, CollectionData } from "../types/collection";
import type { PublicProfile } from "../types/profile";
import { copyToClipboard } from "../utils/clipboard";
import { cardName } from "../utils/localizedCatalog";
import { ProfileAvatar } from "../components/profile/ProfileAvatar";

export function PublicPlayerPage({ mine, myTag }: { mine: CollectionData; myTag?: string | null }) {
  const { t, i18n } = useTranslation(["community", "collection"]);
  const { id = "" } = useParams();
  const [profile, setProfile] = useState<PublicProfile | null>(null); const [collection, setCollection] = useState<CollectionData | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [copied, setCopied] = useState(false); const [filter, setFilter] = useState<CardFilter>("all");
  useEffect(() => { let active = true; setLoading(true); setError(""); void fetchPublicProfile(id).then(async (nextProfile) => { if (!nextProfile) throw new Error(t("community:public.notFound")); const nextCollection = await fetchPublicCollection(id, nextProfile.displayName); if (active) { setProfile(nextProfile); setCollection(nextCollection); } }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : t("community:public.loadError")); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [id, t]);
  const comparison = useMemo(() => collection ? compareCollections(cards, mine, collection) : null, [collection, mine]);
  if (loading) return <PageContainer><div className="pt-8 text-stone-400">{t("community:public.loading")}</div></PageContainer>;
  if (error || !profile || !collection) return <PageContainer><div className="pt-8"><Link className="text-amber-300" to="/comunidade">← {t("community:public.back")}</Link><p className="mt-8 rounded-2xl bg-red-500/10 p-5 text-red-200">{error}</p></div></PageContainer>;
  const proposal = generateTradeProposal(mine, collection, profile, myTag);
  const visibleCards = cards.filter((card) => { const state = collection.cards[card.id]; if (filter === "owned") return state?.owned; if (filter === "missing") return !state?.owned; if (filter === "duplicates") return (state?.duplicates ?? 0) > 0; return true; });
  return <PageContainer><div className="space-y-6 pt-6">
    <Link className="inline-flex items-center gap-2 text-sm font-black text-stone-400 hover:text-white" to="/comunidade"><ArrowLeft size={16} /> {t("community:public.back")}</Link>
    <section className="panel-metal rounded-3xl p-5 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start"><ProfileAvatar avatarUrl={profile.avatarUrl} displayName={profile.displayName} size="xl" /><div className="min-w-0 flex-1"><p className="text-xs font-black uppercase tracking-wider text-amber-400">{t("community:public.eyebrow")}</p><h2 className="mt-1 break-words font-display text-3xl text-white">{profile.displayName}</h2><p className="mt-1 break-words text-sm text-stone-300">{profile.clashNickname} · {profile.clashPlayerTag}</p><p className="mt-1 break-words text-sm text-stone-500">{profile.clanName || t("community:public.noClan")}{profile.clanTag ? ` · ${profile.clanTag}` : ""}</p><p className="mt-3 text-xs text-stone-500">{t("community:public.lastUpdate", { date: profile.lastCollectionUpdate ? new Date(profile.lastCollectionUpdate).toLocaleString(i18n.language) : t("community:public.noDate") })}</p><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => void copyToClipboard(profile.clashPlayerTag)}><Copy size={14} /> {t("community:public.copyPlayerTag")}</Button>{profile.clanTag && <Button size="sm" variant="secondary" onClick={() => void copyToClipboard(profile.clanTag!)}><Copy size={14} /> {t("community:public.copyClanTag")}</Button>}</div>{profile.bio && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-stone-400">{profile.bio}</p>}</div></div></section>
    <section className="panel-wood rounded-3xl p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="flex items-center gap-2 text-xs font-black uppercase text-amber-300"><Swords size={16} /> {t("community:public.compatibility")}</p><div className="mt-3 grid gap-3 md:grid-cols-2"><TradeList title={t("community:public.canOffer", { name: profile.displayName })} items={(comparison?.theirsForMe ?? []).map((card) => `${cardName(card)} x${collection.cards[card.id]?.duplicates ?? 0}`)} /><TradeList title={t("community:public.youCanOffer")} items={(comparison?.mineForThem ?? []).map((card) => `${cardName(card)} x${mine.cards[card.id]?.duplicates ?? 0}`)} /></div></div><Button disabled={!comparison?.theirsForMe.length && !comparison?.mineForThem.length} onClick={() => void copyToClipboard(proposal).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1800); })}><Copy size={16} /> {copied ? t("community:public.copied") : t("community:public.copyProposal")}</Button></div></section>
    <section><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="font-display text-2xl text-white">{t("community:public.collectionOf", { name: profile.displayName })}</h3><select className="field h-10 py-1 text-sm" value={filter} onChange={(event) => setFilter(event.target.value as CardFilter)} aria-label={t("community:public.filter")}><option value="all">{t("collection:filters.all")}</option><option value="owned">{t("collection:filters.owned")}</option><option value="missing">{t("collection:filters.missing")}</option><option value="duplicates">{t("collection:filters.duplicates")}</option></select></div>{categories.map((category) => { const group = visibleCards.filter((card) => card.category === category.id); return group.length ? <div className="mb-7" key={category.id}><h4 className="mb-3 text-xs font-black uppercase tracking-[.16em] text-stone-400">{t(`collection:${category.nameKey}`)}</h4><CardGrid cards={group} getState={(cardId) => collection.cards[cardId] ?? { owned: false, duplicates: 0 }} onToggle={() => undefined} onDuplicatesChange={() => undefined} readOnly /></div> : null; })}</section>
  </div></PageContainer>;
}
function TradeList({ title, items }: { title: string; items: string[] }) { const { t } = useTranslation("community"); return <div className="rounded-2xl bg-black/20 p-3"><h3 className="text-xs font-black text-stone-300">{title}</h3>{items.length ? <ul className="mt-2 space-y-1 text-sm text-stone-400">{items.map((item) => <li key={item}>• {item}</li>)}</ul> : <p className="mt-2 text-xs text-stone-600">{t("public.none")}</p>}</div>; }
