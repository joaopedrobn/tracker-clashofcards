import type { TFunction } from "i18next";
import i18n from "../i18n";
import type { Card, Category } from "../types/card";

export function cardName(card: Card, t: TFunction = i18n.t): string {
  return t(card.nameKey, { ns: "cards" });
}

export function categoryName(category: Category, t: TFunction = i18n.t): string {
  return t(category.nameKey, { ns: "collection" });
}

export function cardSearchText(card: Card): string {
  return ["pt-BR", "en"].map((language) => i18n.getFixedT(language, "cards")(card.nameKey)).join(" ");
}
