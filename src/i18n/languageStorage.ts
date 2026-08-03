export type AppLanguage = "pt-BR" | "en";

export const LANGUAGE_STORAGE_KEY = "clash-card-tracker-language";
export const APP_LANGUAGES: AppLanguage[] = ["pt-BR", "en"];

export function isAppLanguage(value: unknown): value is AppLanguage {
  return value === "pt-BR" || value === "en";
}

export function detectInitialLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isAppLanguage(stored)) return stored;
  } catch { /* continue with browser detection */ }
  if (typeof navigator !== "undefined") return navigator.language.toLowerCase().startsWith("pt") ? "pt-BR" : "en";
  return "pt-BR";
}

export function persistLanguage(language: string): void {
  if (!isAppLanguage(language)) return;
  try { localStorage.setItem(LANGUAGE_STORAGE_KEY, language); } catch { /* storage indisponível */ }
}
