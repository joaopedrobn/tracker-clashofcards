import { CheckCircle2, Edit3, Plus, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ClashAccountFormModal } from "../components/profile/ClashAccountFormModal";
import { ProfileAvatar } from "../components/profile/ProfileAvatar";
import { PageContainer } from "../components/layout/PageContainer";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import type { ClashAccountsState } from "../hooks/useClashAccounts";
import { loadCollectionsForAccounts } from "../repositories/accountCollectionRepository";
import { summarizeCollection } from "../services/collectionSummary";
import type { ClashAccount, ClashAccountInput } from "../types/clashAccount";
import type { CollectionData } from "../types/collection";

export function ClashAccountsPage({ state }: { state: ClashAccountsState }) {
  const { t } = useTranslation(["profile", "common"]);
  const navigate = useNavigate();
  const [editing, setEditing] = useState<ClashAccount | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<ClashAccount | null>(null);
  const [collections, setCollections] = useState<Record<string, CollectionData>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { let active = true; if (!state.accounts.length) { setCollections({}); return; } void loadCollectionsForAccounts(state.accounts).then((value) => { if (active) setCollections(value); }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : t("profile:accounts.errors.loadCollections")); }); return () => { active = false; }; }, [state.accounts, t]);
  const save = async (input: ClashAccountInput) => { if (editing) await state.update(editing.id, input); else await state.create(input); };
  const remove = async () => { if (!deleting) return; setBusy(true); setError(""); try { await state.remove(deleting.id); setDeleting(null); } catch (reason) { setError(reason instanceof Error ? reason.message : t("profile:accounts.errors.delete")); } finally { setBusy(false); } };

  return <PageContainer><div className="space-y-5 pt-6">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.2em] text-amber-400">{t("profile:accounts.eyebrow")}</p><h2 className="font-display text-3xl text-white">{t("profile:accounts.title")}</h2><p className="mt-2 text-sm text-stone-400">{t("profile:accounts.used", { count: state.accounts.length, max: state.maxAccounts })}</p></div><Button disabled={state.limitReached} onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={16} />{t("profile:accounts.add")}</Button></header>
    {state.limitReached && <p className="rounded-2xl border border-amber-300/15 bg-amber-300/7 p-3 text-sm text-amber-100">{t("profile:accounts.limitReached")}</p>}
    {(error || state.accountsError) && <p className="rounded-2xl bg-red-500/10 p-4 text-sm text-red-200">{error || state.accountsError}</p>}
    <div className="grid gap-3 lg:grid-cols-2">{state.accounts.map((account) => { const summary = summarizeCollection(collections[account.id] ?? { version: 2, playerName: account.clashNickname, updatedAt: null, cards: {}, preferences: { category: "all", filter: "all" } }); return <article key={account.id} className="panel-metal min-w-0 rounded-2xl p-4"><div className="flex min-w-0 gap-3"><ProfileAvatar avatarUrl={account.avatarUrl} displayName={account.clashNickname} size="md" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-black text-white">{account.accountLabel}</h3>{account.isPrimary && <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/12 px-2 py-1 text-[10px] font-black text-amber-300"><Star size={11} fill="currentColor" />{t("profile:accounts.primary")}</span>}</div><p className="truncate text-xs text-stone-300">{account.clashNickname} · {account.clashPlayerTag}</p><p className="truncate text-xs text-stone-500">{account.clanName || t("profile:accounts.noClan")}{account.clanTag ? ` · ${account.clanTag}` : ""}</p></div></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3"><Stat value={`${summary.collected}/60`} label={t("profile:accounts.progress")} /><Stat value={summary.missing} label={t("profile:accounts.missing")} /><Stat value={summary.duplicateCopies} label={t("profile:accounts.duplicates")} /></div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => { state.setActiveClashAccountId(account.id); navigate("/"); }}><CheckCircle2 size={14} />{t("profile:accounts.open")}</Button><Button size="sm" variant="secondary" onClick={() => { setEditing(account); setFormOpen(true); }}><Edit3 size={14} />{t("profile:accounts.edit")}</Button>{!account.isPrimary && <Button size="sm" variant="secondary" onClick={() => void state.makePrimary(account.id)}><Star size={14} />{t("profile:accounts.makePrimary")}</Button>}<Button size="sm" variant="danger" disabled={state.accounts.length <= 1} onClick={() => setDeleting(account)}><Trash2 size={14} />{t("profile:accounts.delete")}</Button></div></article>; })}</div>
    <ClashAccountFormModal open={formOpen} account={editing} onClose={() => setFormOpen(false)} onSave={save} />
    <Modal open={Boolean(deleting)} onClose={() => setDeleting(null)} title={t("profile:accounts.deleteTitle")} description={t("profile:accounts.deleteDescription", { account: deleting?.accountLabel })}><p className="rounded-xl border border-red-400/15 bg-red-400/7 p-4 text-sm text-red-100">{t("profile:accounts.deleteWarning")}</p><div className="mt-5 flex justify-end gap-2"><Button variant="secondary" onClick={() => setDeleting(null)}>{t("common:actions.cancel")}</Button><Button variant="danger" disabled={busy} onClick={() => void remove()}>{t("profile:accounts.confirmDelete")}</Button></div></Modal>
  </div></PageContainer>;
}

function Stat({ value, label }: { value: string | number; label: string }) { return <div className="rounded-xl bg-black/20 p-2 text-center"><strong className="block text-sm text-white">{value}</strong><small className="text-[10px] uppercase text-stone-500">{label}</small></div>; }
