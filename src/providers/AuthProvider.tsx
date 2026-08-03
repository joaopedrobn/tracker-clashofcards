import type { PropsWithChildren } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthContext } from "../contexts/AuthContext";
import { isSupabaseEnabled, supabase } from "../lib/supabase";
import {
  sendPasswordReset,
  setNewPassword,
  signInWithPassword,
  signOutFromSupabase,
  signUpWithPassword,
} from "../services/authService";

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(!isSupabaseEnabled);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setInitialized(true);
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
      if (event === "SIGNED_OUT") setRecoveryMode(false);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setInitialized(true);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await signOutFromSupabase();
    setSession(null);
  }, []);
  const updatePassword = useCallback(async (password: string) => {
    await setNewPassword(password);
    setRecoveryMode(false);
  }, []);

  const value = useMemo(() => ({
    enabled: isSupabaseEnabled(),
    initialized,
    authLoading: !initialized,
    session,
    user: session?.user ?? null,
    recoveryMode,
    signIn: signInWithPassword,
    signUp: signUpWithPassword,
    requestPasswordReset: sendPasswordReset,
    updatePassword,
    signOut,
    clearRecoveryMode: () => setRecoveryMode(false),
  }), [initialized, recoveryMode, session, signOut, updatePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
