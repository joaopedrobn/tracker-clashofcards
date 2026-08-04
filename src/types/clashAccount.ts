import type { CollectionData, CollectionSummaryData } from "./collection";

export interface ClashAccount {
  id: string;
  ownerId: string;
  accountLabel: string;
  clashNickname: string;
  clashPlayerTag: string;
  clanName: string | null;
  clanTag: string | null;
  avatarUrl: string | null;
  isPrimary: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClashAccountInput {
  accountLabel: string;
  clashNickname: string;
  clashPlayerTag: string;
  clanName: string;
  clanTag: string;
  avatarUrl: string | null;
}

export interface AccountCard {
  accountId: string;
  cardId: string;
  owned: boolean;
  duplicates: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClashAccountCollection {
  account: ClashAccount;
  collection: CollectionData;
  summary: CollectionSummaryData;
}

export interface AccountTradeOpportunity {
  cardId: string;
  sourceAccountId: string;
  targetAccountId: string;
}
