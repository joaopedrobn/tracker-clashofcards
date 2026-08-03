import i18n from "../i18n";

interface ServiceErrorLike {
  message?: string;
  code?: string;
}

export function localizedDataError(error: ServiceErrorLike | null | undefined, fallbackKey: "generic" | "profileLoad" | "collectionLoad" | "sync" = "generic"): Error {
  const message = error?.message?.toLowerCase() ?? "";
  const code = error?.code ?? "";
  if (code === "42501" || message.includes("permission") || message.includes("row-level security")) {
    return new Error(i18n.t("permission", { ns: "errors" }));
  }
  if (message.includes("fetch") || message.includes("network") || message.includes("connection")) {
    return new Error(i18n.t("network", { ns: "errors" }));
  }
  return new Error(i18n.t(fallbackKey, { ns: "errors" }));
}
