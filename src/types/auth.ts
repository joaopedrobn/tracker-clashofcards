import type { Session, User } from "@supabase/supabase-js";

export type AuthView = "login" | "signup" | "forgot" | "reset";

export interface SignUpResult {
  needsEmailConfirmation: boolean;
}

export interface AuthContextValue {
  enabled: boolean;
  initialized: boolean;
  authLoading: boolean;
  session: Session | null;
  user: User | null;
  recoveryMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearRecoveryMode: () => void;
}
