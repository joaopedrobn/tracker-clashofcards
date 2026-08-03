import type { CollectionData } from "../types/collection";
import i18n from "../i18n";
import { migrateCollectionData } from "./collectionMigration";

const CODE_PREFIX = "CCT2-";
const LEGACY_CODE_PREFIX = "CCT1-";

function toBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64(value: string): string {
  const standard = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(standard.padEnd(Math.ceil(standard.length / 4) * 4, "="));
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

function validateCollection(value: unknown): CollectionData {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(i18n.t("invalidCollection", { ns: "errors" }));
  const candidate = value as Record<string, unknown>;
  if ((candidate.version !== 1 && candidate.version !== 2)
    || !candidate.cards
    || typeof candidate.cards !== "object"
    || Array.isArray(candidate.cards)) {
    throw new Error(i18n.t("unknownCollection", { ns: "errors" }));
  }
  return migrateCollectionData(candidate);
}

export function exportCollectionJson(collection: CollectionData): string {
  return JSON.stringify(collection, null, 2);
}

export function importCollectionJson(value: string): CollectionData {
  try {
    return validateCollection(JSON.parse(value));
  } catch {
    throw new Error(i18n.t("invalidImport", { ns: "errors" }));
  }
}

export function createCollectionCode(collection: CollectionData): string {
  const compact = {
    version: collection.version,
    playerName: collection.playerName,
    updatedAt: collection.updatedAt,
    cards: collection.cards,
    preferences: collection.preferences,
  };
  return `${CODE_PREFIX}${toBase64(JSON.stringify(compact))}`;
}

export function parseCollectionCode(code: string): CollectionData {
  const clean = code.trim();
  const prefix = clean.startsWith(CODE_PREFIX)
    ? CODE_PREFIX
    : clean.startsWith(LEGACY_CODE_PREFIX)
      ? LEGACY_CODE_PREFIX
      : null;
  if (!prefix) throw new Error(i18n.t("invalidCode", { ns: "errors" }));
  try {
    return validateCollection(JSON.parse(fromBase64(clean.slice(prefix.length))));
  } catch {
    throw new Error(i18n.t("invalidCode", { ns: "errors" }));
  }
}
