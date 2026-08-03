import type { Card } from "./card";

export interface TradeComparisonResult {
  theirsForMe: Card[];
  mineForThem: Card[];
  directTrades: Array<{ mine: Card; theirs: Card }>;
  bothNeed: Card[];
  unhelpfulMine: Card[];
  unhelpfulTheirs: Card[];
}

export interface TradeOpportunitySummary {
  theyCanOfferCount: number;
  iCanOfferCount: number;
}
