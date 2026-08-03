import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { detectInitialLanguage, isAppLanguage, persistLanguage } from "./languageStorage";
import { namespaces, resources } from "./resources";

void i18n.use(initReactI18next).init({
  resources,
  lng: detectInitialLanguage(),
  fallbackLng: "pt-BR",
  supportedLngs: ["pt-BR", "en"],
  ns: [...namespaces],
  defaultNS: "common",
  interpolation: { escapeValue: false },
  returnNull: false,
});

i18n.on("languageChanged", (language) => {
  const normalized = language.startsWith("pt") ? "pt-BR" : "en";
  if (!isAppLanguage(normalized)) return;
  persistLanguage(normalized);
  if (typeof document !== "undefined") document.documentElement.lang = normalized;
});

if (typeof document !== "undefined") document.documentElement.lang = i18n.language.startsWith("pt") ? "pt-BR" : "en";

export default i18n;
