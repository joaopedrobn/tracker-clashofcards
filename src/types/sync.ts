import type { CollectionData, CollectionSummaryData } from "./collection";

export type SyncStatus = "idle" | "loading" | "syncing" | "synced" | "offline" | "error";
export type CollectionChoice = "local" | "remote" | "merge";

export interface CollectionConflict {
  local: CollectionData;
  remote: CollectionData;
  localSummary: CollectionSummaryData;
  remoteSummary: CollectionSummaryData;
  remoteUpdatedAt: string | null;
  kind: "local-only" | "both" | "pending";
}

export interface RemoteCollectionSnapshot {
  collection: CollectionData;
  updatedAt: string | null;
}
