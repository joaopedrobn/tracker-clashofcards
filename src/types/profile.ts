import type { CollectionData, CollectionSummaryData } from "./collection";

export interface PublicProfile {
  id: string;
  displayName: string;
  clashNickname: string;
  clashPlayerTag: string;
  clanName: string | null;
  clanTag: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  lastCollectionUpdate: string | null;
}

export interface ProfileInput {
  displayName: string;
  clashNickname: string;
  clashPlayerTag: string;
  clanName: string;
  clanTag: string;
  bio: string;
  avatarUrl: string | null;
  isPublic: boolean;
}

export interface RemoteUserCard {
  userId: string;
  cardId: string;
  owned: boolean;
  duplicates: number;
  createdAt: string;
  updatedAt: string;
}

export type CommunitySort = "recent" | "progress" | "duplicates" | "same-clan";

export interface PublicPlayer extends PublicProfile {
  summary: CollectionSummaryData;
  collection: CollectionData;
}

export interface CommunityResult {
  players: PublicPlayer[];
  total: number;
}
