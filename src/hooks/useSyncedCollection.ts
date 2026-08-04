import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import i18n from "../i18n";
import { loadAccountCollection, replaceAccountCollection } from "../repositories/accountCollectionRepository";
import { loadCollection, STORAGE_KEY } from "../services/collectionStorage";
import { collectionCardsEqual, hasCollectionCards, mergeCollections } from "../services/localCollectionMerge";
import { summarizeCollection } from "../services/collectionSummary";
import type { CollectionData } from "../types/collection";
import type { CollectionChoice, CollectionConflict, SyncStatus } from "../types/sync";
import { useCollection } from "./useCollection";
import { accountCollectionCacheKey } from "../services/clashAccountState";

const DEBOUNCE_MS = 450;
const pendingKey = (userId: string, accountId: string) => `clash-card-tracker-sync-pending-v3:${userId}:${accountId}`;
const decisionKey = (userId: string, accountId: string) => `clash-card-tracker-merge-v3:${userId}:${accountId}`;
const importedGuestKey = (userId: string) => `clash-card-tracker-guest-imported:${userId}`;

function cardSignature(collection: CollectionData): string {
  return JSON.stringify(Object.entries(collection.cards).filter(([, state]) => state.owned || state.duplicates > 0).sort(([a], [b]) => a.localeCompare(b)));
}

export function useSyncedCollection(userId: string | null, accountId: string | null, canSync: boolean, playerName: string) {
  const storageKey = userId && accountId ? accountCollectionCacheKey(userId, accountId) : STORAGE_KEY;
  const local = useCollection(storageKey);
  const replaceLocalCollection = local.replaceCollection;
  const currentRef = useRef(local.collection);
  const lastSyncedSignature = useRef("");
  const syncRun = useRef(0);
  const timer = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [syncError, setSyncError] = useState("");
  const [conflict, setConflict] = useState<CollectionConflict | null>(null);
  currentRef.current = local.collection;

  const cancelTimer = useCallback(() => { if (timer.current !== null) window.clearTimeout(timer.current); timer.current = null; }, []);

  useEffect(() => {
    cancelTimer();
    const run = ++syncRun.current;
    setReady(false); setConflict(null); setSyncError("");
    if (!userId || !accountId || !canSync) { setStatus("idle"); return; }
    setStatus("loading");
    void loadAccountCollection(accountId, playerName).then((snapshot) => {
      if (run !== syncRun.current) return;
      const hasAccountCache = localStorage.getItem(accountCollectionCacheKey(userId, accountId)) !== null;
      const guestCollection = loadCollection();
      const shouldOfferGuestImport = !hasAccountCache && localStorage.getItem(importedGuestKey(userId)) !== "1" && hasCollectionCards(guestCollection);
      const localCollection = shouldOfferGuestImport ? { ...guestCollection, playerName } : currentRef.current;
      if (shouldOfferGuestImport) replaceLocalCollection(localCollection);
      const remoteCollection = snapshot.collection;
      const localHasCards = hasCollectionCards(localCollection);
      const remoteHasCards = hasCollectionCards(remoteCollection);
      const equal = collectionCardsEqual(localCollection, remoteCollection);
      const hasPendingWrite = localStorage.getItem(pendingKey(userId, accountId)) === "1";
      if (equal) {
        lastSyncedSignature.current = cardSignature(remoteCollection);
        localStorage.removeItem(pendingKey(userId, accountId)); localStorage.setItem(importedGuestKey(userId), "1");
        setReady(true); setStatus("synced"); return;
      }
      if (!localHasCards && remoteHasCards && !hasPendingWrite) {
        lastSyncedSignature.current = cardSignature(remoteCollection);
        replaceLocalCollection(remoteCollection); localStorage.setItem(importedGuestKey(userId), "1");
        setReady(true); setStatus("synced"); return;
      }
      setConflict({ local: localCollection, remote: remoteCollection, localSummary: summarizeCollection(localCollection), remoteSummary: summarizeCollection(remoteCollection), remoteUpdatedAt: snapshot.updatedAt, kind: hasPendingWrite ? "pending" : remoteHasCards ? "both" : "local-only" });
      setStatus(hasPendingWrite ? "error" : "idle");
    }).catch((reason) => {
      if (run !== syncRun.current) return;
      setSyncError(reason instanceof Error ? reason.message : i18n.t("collectionLoad", { ns: "errors" }));
      setStatus(navigator.onLine ? "error" : "offline");
    });
    return cancelTimer;
  }, [accountId, canSync, cancelTimer, playerName, replaceLocalCollection, userId]);

  const upload = useCallback(async (collection: CollectionData) => {
    if (!userId || !accountId) return;
    cancelTimer(); setStatus(navigator.onLine ? "syncing" : "offline"); setSyncError("");
    localStorage.setItem(pendingKey(userId, accountId), "1");
    try {
      const updatedAt = await replaceAccountCollection(accountId, collection);
      lastSyncedSignature.current = cardSignature(collection);
      localStorage.setItem(decisionKey(userId, accountId), JSON.stringify({ signature: lastSyncedSignature.current, at: updatedAt }));
      localStorage.removeItem(pendingKey(userId, accountId)); localStorage.setItem(importedGuestKey(userId), "1");
      if (currentRef.current.updatedAt !== updatedAt) replaceLocalCollection({ ...currentRef.current, updatedAt });
      setStatus("synced");
    } catch (reason) {
      setSyncError(reason instanceof Error ? reason.message : i18n.t("sync", { ns: "errors" }));
      setStatus(navigator.onLine ? "error" : "offline"); throw reason;
    }
  }, [accountId, cancelTimer, replaceLocalCollection, userId]);

  const resolveConflict = useCallback(async (choice: CollectionChoice) => {
    if (!conflict || !userId || !accountId) return;
    if (choice === "remote") {
      lastSyncedSignature.current = cardSignature(conflict.remote); replaceLocalCollection(conflict.remote);
      localStorage.setItem(decisionKey(userId, accountId), JSON.stringify({ signature: lastSyncedSignature.current, at: new Date().toISOString() }));
      localStorage.removeItem(pendingKey(userId, accountId)); localStorage.setItem(importedGuestKey(userId), "1");
      setConflict(null); setReady(true); setStatus("synced"); return;
    }
    const selected = choice === "merge" ? mergeCollections(conflict.local, conflict.remote) : { ...conflict.local, updatedAt: new Date().toISOString() };
    replaceLocalCollection(selected);
    try { await upload(selected); setConflict(null); setReady(true); } catch { /* keep conflict open */ }
  }, [accountId, conflict, replaceLocalCollection, upload, userId]);

  useEffect(() => {
    if (!ready || !userId || !accountId || !canSync || conflict) return;
    const signature = cardSignature(local.collection);
    if (signature === lastSyncedSignature.current) return;
    cancelTimer(); setStatus(navigator.onLine ? "syncing" : "offline"); localStorage.setItem(pendingKey(userId, accountId), "1");
    timer.current = window.setTimeout(() => { void upload(currentRef.current).catch(() => undefined); }, DEBOUNCE_MS);
    return cancelTimer;
  }, [accountId, canSync, cancelTimer, conflict, local.collection, ready, upload, userId]);

  useEffect(() => {
    const online = () => { if (status === "offline" && ready) void upload(currentRef.current).catch(() => undefined); };
    const offline = () => { if (userId && accountId) setStatus("offline"); };
    window.addEventListener("online", online); window.addEventListener("offline", offline);
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offline); };
  }, [accountId, ready, status, upload, userId]);

  const retrySync = useCallback(async () => {
    if (!userId || !accountId) return;
    try { if (conflict) await resolveConflict("merge"); else await upload(currentRef.current); } catch { /* cache remains available */ }
  }, [accountId, conflict, resolveConflict, upload, userId]);

  return useMemo(() => ({ ...local, syncStatus: status, syncError, conflict, resolveConflict, retrySync }), [conflict, local, resolveConflict, retrySync, status, syncError]);
}

export type SyncedCollection = ReturnType<typeof useSyncedCollection>;
