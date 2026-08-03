import { cards } from "../data/cards";
import i18n from "../i18n";
import type { CollectionData } from "../types/collection";
import type { PublicProfile } from "../types/profile";
import { cardName } from "../utils/localizedCatalog";
import { compareCollections } from "./tradeComparison";

export function generateTradeProposal(mine: CollectionData, theirs: CollectionData, profile: PublicProfile, myTag?: string | null): string {
  const t = i18n.getFixedT(i18n.language, "exchange");
  const comparison = compareCollections(cards, mine, theirs);
  const lines = [t("proposal.greeting", { name: profile.displayName }), "", t("proposal.found"), ""];
  if (comparison.theirsForMe.length) lines.push(t("proposal.theirs"), ...comparison.theirsForMe.map((card) => `- ${cardName(card)} x${theirs.cards[card.id]?.duplicates ?? 0}`), "");
  if (comparison.mineForThem.length) lines.push(t("proposal.mine"), ...comparison.mineForThem.map((card) => `- ${cardName(card)} x${mine.cards[card.id]?.duplicates ?? 0}`), "");
  if (myTag) lines.push(t("proposal.myTag", { tag: myTag }));
  lines.push(t("proposal.theirTag", { tag: profile.clashPlayerTag }));
  return lines.join("\n").trim();
}
