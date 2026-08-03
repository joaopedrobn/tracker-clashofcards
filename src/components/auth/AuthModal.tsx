import { KeyRound, LogIn, Mail, UserPlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import type { AuthView } from "../../types/auth";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

interface AuthModalProps { open: boolean; initialView?: AuthView; onClose: () => void; }

export function AuthModal({ open, initialView = "login", onClose }: AuthModalProps) {
  const auth = useAuth();
  const { t } = useTranslation(["auth", "errors"]);
  const [view, setView] = useState<AuthView>(initialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { if (open) setView(auth.recoveryMode ? "reset" : initialView); }, [auth.recoveryMode, initialView, open]);
  const changeView = (nextView: AuthView) => { setView(nextView); setError(""); setMessage(""); };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setMessage("");
    if (!email.trim() && view !== "reset") return setError(t("auth:validation.emailRequired"));
    if (view !== "reset" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError(t("auth:validation.emailInvalid"));
    if (view !== "forgot" && password.length < 8) return setError(t("auth:validation.passwordMin"));
    if ((view === "signup" || view === "reset") && password !== confirmPassword) return setError(t("auth:validation.passwordsMismatch"));
    setBusy(true);
    try {
      if (view === "login") { await auth.signIn(email.trim(), password); onClose(); }
      else if (view === "signup") { const result = await auth.signUp(email.trim(), password); if (result.needsEmailConfirmation) setMessage(t("auth:messages.confirmEmail")); else onClose(); }
      else if (view === "forgot") { await auth.requestPasswordReset(email.trim()); setMessage(t("auth:messages.resetSent")); }
      else { await auth.updatePassword(password); setMessage(t("auth:messages.passwordUpdated")); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : t("errors:generic")); }
    finally { setBusy(false); }
  };

  const title = t(`auth:${view}`);
  const emailId = `auth-email-${view}`;
  const passwordId = `auth-password-${view}`;
  const confirmationId = `auth-password-confirmation-${view}`;
  return <Modal open={open} onClose={onClose} title={title} description={t("auth:description")} dismissible={!auth.recoveryMode}>
    {!auth.enabled ? <p className="rounded-2xl border border-amber-300/20 bg-amber-300/8 p-4 text-sm text-amber-100">{t("auth:notConfigured")}</p> :
      <form className="space-y-4" name={`auth-${view}`} autoComplete="on" noValidate onSubmit={submit}>
        {view !== "reset" && <div className="block"><label htmlFor={emailId} className="mb-2 block text-xs font-black uppercase tracking-wider text-stone-400">{t("auth:email")}</label><div className="input-wrapper"><Mail className="input-icon" size={17} aria-hidden="true" /><input id={emailId} name="email" className="field auth-field input-with-icon h-12 w-full" type="email" inputMode="email" autoComplete={view === "login" ? "username" : "email"} autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t("auth:emailPlaceholder")} /></div></div>}
        {view !== "forgot" && <div className="block"><label htmlFor={passwordId} className="mb-2 block text-xs font-black uppercase tracking-wider text-stone-400">{t("auth:password")}</label><div className="input-wrapper"><KeyRound className="input-icon" size={17} aria-hidden="true" /><input id={passwordId} name="password" className="field auth-field input-with-icon h-12 w-full" type="password" autoComplete={view === "login" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t("auth:passwordPlaceholder")} /></div></div>}
        {(view === "signup" || view === "reset") && <div className="block"><label htmlFor={confirmationId} className="mb-2 block text-xs font-black uppercase tracking-wider text-stone-400">{t("auth:confirmPassword")}</label><div className="input-wrapper"><KeyRound className="input-icon" size={17} aria-hidden="true" /><input id={confirmationId} name="password-confirmation" className="field auth-field input-with-icon h-12 w-full" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder={t("auth:passwordPlaceholder")} /></div></div>}
        {error && <p role="alert" className="rounded-xl bg-red-500/12 p-3 text-sm text-red-200">{error}</p>}
        {message && <p role="status" className="rounded-xl bg-emerald-500/12 p-3 text-sm text-emerald-200">{message}</p>}
        <Button className="w-full" disabled={busy} type="submit">{view === "login" ? <LogIn size={17} /> : <UserPlus size={17} />}{busy ? t("auth:wait") : title}</Button>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-stone-400">
          {view === "login" && <><button type="button" className="rounded-lg border border-amber-300/25 bg-amber-300/8 px-3 py-2 font-black text-amber-300 transition hover:border-amber-300/45 hover:bg-amber-300/14 focus-visible:outline-amber-300" onClick={() => changeView("signup")}>{t("auth:signup")}</button><button type="button" className="rounded-lg px-3 py-2 hover:bg-white/6 hover:text-white" onClick={() => changeView("forgot")}>{t("auth:forgotLink")}</button></>}
          {(view === "signup" || view === "forgot") && <button type="button" className="rounded-lg px-3 py-2 font-black text-amber-300 hover:bg-amber-300/8" onClick={() => changeView("login")}>{t("auth:backLogin")}</button>}
        </div>
      </form>}
  </Modal>;
}
