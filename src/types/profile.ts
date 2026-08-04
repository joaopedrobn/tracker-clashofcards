import type { CollectionData, CollectionSummaryData } from "./collection";
import type { ClashAccount } from "./clashAccount";

export interface PublicProfile {
  id: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  lastCollectionUpdate: string | null;
}

export interface ProfileInput {
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  isPublic: boolean;
}

export type CommunitySort = "recent" | "progress" | "duplicates" | "same-clan";

export interface PublicPlayer extends PublicProfile {
  accounts: ClashAccount[];
  primaryAccount: ClashAccount | null;
  accountCount: number;
  summary: CollectionSummaryData;
  collection: CollectionData;
  collections: Record<string, CollectionData>;
}

export interface CommunityResult {
  players: PublicPlayer[];
  total: number;
}
