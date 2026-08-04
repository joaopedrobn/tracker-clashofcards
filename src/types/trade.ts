import type { Card } from "./card";
import type { AccountTradeOpportunity } from "./clashAccount";

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

export interface MultiAccountTradeComparison {
  theirsForMe: AccountTradeOpportunity[];
  mineForThem: AccountTradeOpportunity[];
}

export interface AccountTradeSummary {
  theyCanOfferCount: number;
  iCanOfferCount: number;
}
