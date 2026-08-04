import { Check } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { getAvatarByUrl, getDefaultAvatar, PROFILE_AVATARS } from "../../data/avatars";
import type { ProfileInput, PublicProfile } from "../../types/profile";
import { ProfileAvatar } from "./ProfileAvatar";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

const createEmptyProfile = (): ProfileInput => ({
  displayName: "",
  bio: "",
  avatarUrl: getDefaultAvatar()?.image ?? null,
  isPublic: true,
});

interface Props { open: boolean; profile: PublicProfile | null; required?: boolean; onClose: () => void; onSave: (input: ProfileInput) => Promise<PublicProfile>; }

export function ProfileFormModal({ open, profile, required = false, onClose, onSave }: Props) {
  const { t } = useTranslation(["profile", "common"]);
  const [form, setForm] = useState<ProfileInput>(createEmptyProfile);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    setError("");
    setForm(profile ? {
      displayName: profile.displayName,
      bio: profile.bio ?? "",
      avatarUrl: getAvatarByUrl(profile.avatarUrl)?.image ?? null,
      isPublic: profile.isPublic,
    } : createEmptyProfile());
  }, [open, profile]);
  const update = <K extends keyof ProfileInput,>(key: K, value: ProfileInput[K]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try { await onSave(form); onClose(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : t("profile:saveError")); }
    finally { setBusy(false); }
  };
  return <Modal open={open} onClose={onClose} dismissible={!required} title={t(profile ? "profile:editTitle" : "profile:completeTitle")} description={t(required ? "profile:completeDescription" : "profile:editDescription")}>
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-black text-white">{t("profile:chooseAvatar")}</legend>
        <p className="mt-1 text-xs leading-relaxed text-stone-400">{t("profile:avatarDescription")}</p>
        {profile && !getAvatarByUrl(form.avatarUrl) && PROFILE_AVATARS.length > 0 && <div className="mt-3 flex items-center gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/7 p-3"><ProfileAvatar avatarUrl={profile.avatarUrl} displayName={form.displayName || profile.displayName} /><p className="text-xs leading-relaxed text-amber-100">{t("profile:invalidAvatarFallback")}</p></div>}
        {PROFILE_AVATARS.length ? <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
          {PROFILE_AVATARS.map((avatar) => {
            const selected = form.avatarUrl === avatar.image;
            return <button key={avatar.id} type="button" className={`relative aspect-square overflow-hidden rounded-2xl border-2 bg-black/20 p-1.5 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${selected ? "border-amber-300 shadow-[0_0_18px_rgba(246,184,62,.24)] -translate-y-0.5" : "border-white/8 hover:border-white/25 hover:bg-white/5"}`} aria-label={t("profile:avatarOption", { number: avatar.order })} aria-pressed={selected} onClick={() => update("avatarUrl", avatar.image)}>
              <img src={avatar.image} alt="" className="size-full rounded-xl object-cover" />
              {selected && <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-amber-300 text-stone-950 shadow" title={t("profile:avatarSelected")}><Check size={13} strokeWidth={3} aria-hidden="true" /></span>}
            </button>;
          })}
        </div> : <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 p-3"><ProfileAvatar displayName={form.displayName} /><p className="text-sm text-stone-400">{t("profile:noAvatars")}</p></div>}
      </fieldset>
      <Field label={t("profile:displayName")} value={form.displayName} maxLength={40} onChange={(value) => update("displayName", value)} />
      <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4"><input type="checkbox" checked={form.isPublic} onChange={(event) => update("isPublic", event.target.checked)} /><span className="text-sm font-bold text-stone-200">{t("profile:public")}</span></label>
      <label className="sm:col-span-2"><span className="mb-2 block text-xs font-black uppercase text-stone-400">{t("profile:bio")}</span><textarea className="field min-h-24 w-full resize-y" maxLength={240} value={form.bio} onChange={(event) => update("bio", event.target.value)} /><small className="mt-1 block text-right text-stone-500">{form.bio.length}/240</small></label>
      {form.isPublic && <p className="rounded-xl border border-sky-300/15 bg-sky-300/7 p-3 text-xs leading-relaxed text-sky-100 sm:col-span-2">{t("profile:publicNotice")}</p>}
      {error && <p role="alert" className="rounded-xl bg-red-500/12 p-3 text-sm text-red-200 sm:col-span-2">{error}</p>}
      <div className="flex justify-end gap-2 sm:col-span-2">{!required && <Button type="button" variant="secondary" onClick={onClose}>{t("common:actions.cancel")}</Button>}<Button type="submit" disabled={busy}>{busy ? t("profile:saving") : t("profile:save")}</Button></div>
    </form>
  </Modal>;
}

function Field({ label, value, onChange, maxLength }: { label: string; value: string; onChange: (value: string) => void; maxLength?: number }) {
  return <label><span className="mb-2 block text-xs font-black uppercase text-stone-400">{label}</span><input className="field h-12 w-full" maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
