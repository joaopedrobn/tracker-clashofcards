import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchOwnCollection, replaceOwnCollection } from "../repositories/collectionRepository";
import { collectionCardsEqual, hasCollectionCards, mergeCollections } from "../services/localCollectionMerge";
import { summarizeCollection } from "../services/collectionSummary";
import type { CollectionData } from "../types/collection";
import type { CollectionChoice, CollectionConflict, SyncStatus } from "../types/sync";
import { useCollection } from "./useCollection";
import i18n from "../i18n";

const DEBOUNCE_MS = 450;
const OWNER_KEY = "clash-card-tracker-sync-owner-v2";
const pendingKey = (userId: string) => `clash-card-tracker-sync-pending-v2:${userId}`;
const decisionKey = (userId: string) => `clash-card-tracker-merge-v2:${userId}`;

function cardSignature(collection: CollectionData): string {
  return JSON.stringify(Object.entries(collection.cards)
    .filter(([, state]) => state.owned || state.duplicates > 0)
    .sort(([a], [b]) => a.localeCompare(b)));
}

export function useSyncedCollection(userId: string | null, canSync: boolean, playerName: string) {
  const local = useCollection();
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

  const cancelTimer = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => {
    cancelTimer();
    const run = ++syncRun.current;
    setReady(false);
    setConflict(null);
    setSyncError("");
    if (!userId || !canSync) {
      setStatus("idle");
      return;
    }

    setStatus("loading");
    void fetchOwnCollection(playerName).then((snapshot) => {
      if (run !== syncRun.current) return;
      const localCollection = currentRef.current;
      const remoteCollection = snapshot.collection;
      const localHasCards = hasCollectionCards(localCollection);
      const remoteHasCards = hasCollectionCards(remoteCollection);
      const equal = collectionCardsEqual(localCollection, remoteCollection);
      const hasPendingWrite = localStorage.getItem(pendingKey(userId)) === "1";
      const previousOwner = localStorage.getItem(OWNER_KEY);

      if (equal) {
        lastSyncedSignature.current = cardSignature(remoteCollection);
        localStorage.setItem(OWNER_KEY, userId);
        localStorage.removeItem(pendingKey(userId));
        setReady(true);
        setStatus("synced");
        return;
      }
      if (!localHasCards && remoteHasCards && !hasPendingWrite) {
        lastSyncedSignature.current = cardSignature(remoteCollection);
        replaceLocalCollection(remoteCollection);
        localStorage.setItem(OWNER_KEY, userId);
        setReady(true);
        setStatus("synced");
        return;
      }

      setConflict({
        local: localCollection,
        remote: remoteCollection,
        localSummary: summarizeCollection(localCollection),
        remoteSummary: summarizeCollection(remoteCollection),
        remoteUpdatedAt: snapshot.updatedAt,
        kind: hasPendingWrite ? "pending" : previousOwner && previousOwner !== userId ? "both" : remoteHasCards ? "both" : "local-only",
      });
      setStatus(hasPendingWrite ? "error" : "idle");
    }).catch((reason) => {
      if (run !== syncRun.current) return;
      setSyncError(reason instanceof Error ? reason.message : i18n.t("collectionLoad", { ns: "errors" }));
      setStatus(navigator.onLine ? "error" : "offline");
    });
    return cancelTimer;
  }, [canSync, cancelTimer, playerName, replaceLocalCollection, userId]);

  const upload = useCallback(async (collection: CollectionData) => {
    if (!userId) return;
    cancelTimer();
    setStatus(navigator.onLine ? "syncing" : "offline");
    setSyncError("");
    localStorage.setItem(pendingKey(userId), "1");
    try {
      const updatedAt = await replaceOwnCollection(collection);
      lastSyncedSignature.current = cardSignature(collection);
      localStorage.setItem(OWNER_KEY, userId);
      localStorage.setItem(decisionKey(userId), JSON.stringify({ signature: lastSyncedSignature.current, at: updatedAt }));
      localStorage.removeItem(pendingKey(userId));
      if (currentRef.current.updatedAt !== updatedAt) {
        replaceLocalCollection({ ...currentRef.current, updatedAt });
      }
      setStatus("synced");
    } catch (reason) {
      setSyncError(reason instanceof Error ? reason.message : i18n.t("sync", { ns: "errors" }));
      setStatus(navigator.onLine ? "error" : "offline");
      throw reason;
    }
  }, [cancelTimer, replaceLocalCollection, userId]);

  const resolveConflict = useCallback(async (choice: CollectionChoice) => {
    if (!conflict || !userId) return;
    if (choice === "remote") {
      lastSyncedSignature.current = cardSignature(conflict.remote);
      replaceLocalCollection(conflict.remote);
      localStorage.setItem(OWNER_KEY, userId);
      localStorage.setItem(decisionKey(userId), JSON.stringify({ signature: lastSyncedSignature.current, at: new Date().toISOString() }));
      localStorage.removeItem(pendingKey(userId));
      setConflict(null);
      setReady(true);
      setStatus("synced");
      return;
    }
    const selected = choice === "merge" ? mergeCollections(conflict.local, conflict.remote) : {
      ...conflict.local,
      updatedAt: new Date().toISOString(),
    };
    replaceLocalCollection(selected);
    try {
      await upload(selected);
      setConflict(null);
      setReady(true);
    } catch {
      // O conflito permanece aberto para permitir nova tentativa sem perder dados.
    }
  }, [conflict, replaceLocalCollection, upload, userId]);

  useEffect(() => {
    if (!ready || !userId || !canSync || conflict) return;
    const signature = cardSignature(local.collection);
    if (signature === lastSyncedSignature.current) return;
    cancelTimer();
    setStatus(navigator.onLine ? "syncing" : "offline");
    localStorage.setItem(pendingKey(userId), "1");
    timer.current = window.setTimeout(() => {
      void upload(currentRef.current).catch(() => undefined);
    }, DEBOUNCE_MS);
    return cancelTimer;
  }, [canSync, cancelTimer, conflict, local.collection, ready, upload, userId]);

  useEffect(() => {
    const online = () => {
      if (status === "offline" && ready) void upload(currentRef.current).catch(() => undefined);
    };
    const offline = () => { if (userId) setStatus("offline"); };
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, [ready, status, upload, userId]);

  const retrySync = useCallback(async () => {
    if (!userId) return;
    try {
      if (conflict) {
        await resolveConflict("merge");
        return;
      }
      await upload(currentRef.current);
    } catch {
      // upload já preserva o cache local e publica o erro para a interface.
    }
  }, [conflict, resolveConflict, upload, userId]);

  return useMemo(() => ({
    ...local,
    syncStatus: status,
    syncError,
    conflict,
    resolveConflict,
    retrySync,
  }), [conflict, local, resolveConflict, retrySync, status, syncError]);
}

export type SyncedCollection = ReturnType<typeof useSyncedCollection>;
