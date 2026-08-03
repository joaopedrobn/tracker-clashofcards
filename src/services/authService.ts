import { requireSupabase } from "../lib/supabase";
import type { SignUpResult } from "../types/auth";
import i18n from "../i18n";

function authError(message: string): Error {
  const lower = message.toLocaleLowerCase("en-US");
  if (lower.includes("invalid login credentials")) return new Error(i18n.t("invalidCredentials", { ns: "errors" }));
  if (lower.includes("email not confirmed")) return new Error(i18n.t("emailNotConfirmed", { ns: "errors" }));
  if (lower.includes("user already registered")) return new Error(i18n.t("alreadyRegistered", { ns: "errors" }));
  if (lower.includes("rate limit")) return new Error(i18n.t("rateLimit", { ns: "errors" }));
  return new Error(i18n.t("authGeneric", { ns: "errors" }));
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await requireSupabase().auth.signInWithPassword({ email, password });
  if (error) throw authError(error.message);
}

export async function signUpWithPassword(email: string, password: string): Promise<SignUpResult> {
  const { data, error } = await requireSupabase().auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw authError(error.message);
  return { needsEmailConfirmation: !data.session };
}

export async function sendPasswordReset(email: string): Promise<void> {
  const redirectTo = `${window.location.origin}/redefinir-senha`;
  const { error } = await requireSupabase().auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw authError(error.message);
}

export async function setNewPassword(password: string): Promise<void> {
  const { error } = await requireSupabase().auth.updateUser({ password });
  if (error) throw authError(error.message);
}

export async function signOutFromSupabase(): Promise<void> {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw authError(error.message);
}
