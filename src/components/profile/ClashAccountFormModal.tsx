import { Check } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { getAvatarByUrl, getDefaultAvatar, PROFILE_AVATARS } from "../../data/avatars";
import type { ClashAccount, ClashAccountInput } from "../../types/clashAccount";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

const emptyAccount = (): ClashAccountInput => ({ accountLabel: "", clashNickname: "", clashPlayerTag: "", clanName: "", clanTag: "", avatarUrl: getDefaultAvatar()?.image ?? null });

interface Props {
  open: boolean;
  account: ClashAccount | null;
  required?: boolean;
  onClose: () => void;
  onSave: (input: ClashAccountInput) => Promise<unknown>;
}

export function ClashAccountFormModal({ open, account, required = false, onClose, onSave }: Props) {
  const { t } = useTranslation(["profile", "common"]);
  const [form, setForm] = useState<ClashAccountInput>(emptyAccount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(account ? { accountLabel: account.accountLabel, clashNickname: account.clashNickname, clashPlayerTag: account.clashPlayerTag, clanName: account.clanName ?? "", clanTag: account.clanTag ?? "", avatarUrl: getAvatarByUrl(account.avatarUrl)?.image ?? getDefaultAvatar()?.image ?? null } : emptyAccount());
  }, [account, open]);
  const update = <K extends keyof ClashAccountInput,>(key: K, value: ClashAccountInput[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try { await onSave(form); onClose(); } catch (reason) { setError(reason instanceof Error ? reason.message : t("profile:accounts.errors.save")); } finally { setBusy(false); }
  };
  return <Modal open={open} onClose={onClose} dismissible={!required} title={t(account ? "profile:accounts.editTitle" : required ? "profile:accounts.firstTitle" : "profile:accounts.addTitle")} description={t(required ? "profile:accounts.firstDescription" : "profile:accounts.formDescription")}>
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
      <Field label={t("profile:accounts.label")} value={form.accountLabel} maxLength={40} onChange={(value) => update("accountLabel", value)} />
      <Field label={t("profile:nickname")} value={form.clashNickname} maxLength={40} onChange={(value) => update("clashNickname", value)} />
      <Field label={t("profile:playerTag")} value={form.clashPlayerTag} placeholder="#2P0LYQ" uppercase onChange={(value) => update("clashPlayerTag", value)} />
      <Field label={t("profile:clanName")} value={form.clanName} maxLength={50} onChange={(value) => update("clanName", value)} />
      <Field label={t("profile:clanTag")} value={form.clanTag} placeholder="#CLAN" uppercase onChange={(value) => update("clanTag", value)} />
      <fieldset className="sm:col-span-2"><legend className="text-xs font-black uppercase text-stone-400">{t("profile:accounts.avatar")}</legend><div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-8">
        {PROFILE_AVATARS.map((avatar) => { const selected = form.avatarUrl === avatar.image; return <button key={avatar.id} type="button" className={`relative aspect-square overflow-hidden rounded-xl border-2 p-1 ${selected ? "border-amber-300" : "border-white/8"}`} aria-label={t("profile:avatarOption", { number: avatar.order })} aria-pressed={selected} onClick={() => update("avatarUrl", avatar.image)}><img src={avatar.image} alt="" className="size-full rounded-lg object-cover" />{selected && <span className="absolute right-1 top-1 rounded-full bg-amber-300 p-0.5 text-stone-950"><Check size={11} /></span>}</button>; })}
      </div></fieldset>
      {error && <p role="alert" className="rounded-xl bg-red-500/12 p-3 text-sm text-red-200 sm:col-span-2">{error}</p>}
      <div className="flex justify-end gap-2 sm:col-span-2">{!required && <Button type="button" variant="secondary" onClick={onClose}>{t("common:actions.cancel")}</Button>}<Button type="submit" disabled={busy}>{busy ? t("profile:accounts.saving") : t("profile:accounts.save")}</Button></div>
    </form>
  </Modal>;
}

function Field({ label, value, onChange, maxLength, placeholder, uppercase }: { label: string; value: string; onChange: (value: string) => void; maxLength?: number; placeholder?: string; uppercase?: boolean }) {
  return <label><span className="mb-2 block text-xs font-black uppercase text-stone-400">{label}</span><input className={`field h-12 w-full ${uppercase ? "uppercase" : ""}`} required={!label.toLowerCase().includes("clã") && !label.toLowerCase().includes("clan")} maxLength={maxLength} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
