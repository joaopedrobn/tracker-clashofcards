import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import i18n from "../i18n";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();

const enabled = Boolean(supabaseUrl && supabaseKey);

export const supabase: SupabaseClient | null = enabled
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function isSupabaseEnabled(): boolean {
  return enabled;
}

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error(i18n.t("accountUnavailable", { ns: "errors" }));
  return supabase;
}
