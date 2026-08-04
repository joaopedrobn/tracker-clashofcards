import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import i18n from "../i18n";
import {
  createClashAccount,
  deleteClashAccount,
  listMyClashAccounts,
  MAX_FREE_CLASH_ACCOUNTS,
  setPrimaryClashAccount,
  updateClashAccount,
} from "../repositories/clashAccountRepository";
import type { ClashAccount, ClashAccountInput } from "../types/clashAccount";
import { activeClashAccountStorageKey, chooseActiveClashAccount } from "../services/clashAccountState";

export function useClashAccounts(userId: string | null, enabled: boolean) {
  const request = useRef(0);
  const [accounts, setAccounts] = useState<ClashAccount[]>([]);
  const [activeClashAccountId, setActiveState] = useState<string | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [accountsError, setAccountsError] = useState("");

  const reload = useCallback(async () => {
    const run = ++request.current;
    if (!userId || !enabled) {
      setAccounts([]); setActiveState(null); setAccountsLoading(false); setAccountsLoaded(false); setAccountsError("");
      return [];
    }
    setAccountsLoading(true); setAccountsLoaded(false); setAccountsError("");
    try {
      const next = await listMyClashAccounts();
      if (request.current !== run) return next;
      setAccounts(next);
      const stored = localStorage.getItem(activeClashAccountStorageKey(userId));
      const selected = chooseActiveClashAccount(next, stored);
      setActiveState(selected?.id ?? null);
      if (selected) localStorage.setItem(activeClashAccountStorageKey(userId), selected.id);
      setAccountsLoaded(true);
      return next;
    } catch (reason) {
      if (request.current === run) setAccountsError(reason instanceof Error ? reason.message : i18n.t("accounts.errors.load", { ns: "profile" }));
      return [];
    } finally {
      if (request.current === run) setAccountsLoading(false);
    }
  }, [enabled, userId]);

  useEffect(() => { void reload(); return () => { request.current += 1; }; }, [reload]);

  const setActiveClashAccountId = useCallback((accountId: string) => {
    if (!userId || !accounts.some((account) => account.id === accountId)) return;
    localStorage.setItem(activeClashAccountStorageKey(userId), accountId);
    setActiveState(accountId);
  }, [accounts, userId]);

  const create = useCallback(async (input: ClashAccountInput) => {
    const created = await createClashAccount(input);
    const next = await reload();
    if (userId) localStorage.setItem(activeClashAccountStorageKey(userId), created.id);
    setActiveState(created.id);
    return next.find((account) => account.id === created.id) ?? created;
  }, [reload, userId]);

  const update = useCallback(async (accountId: string, input: ClashAccountInput) => {
    const saved = await updateClashAccount(accountId, input); await reload(); return saved;
  }, [reload]);
  const remove = useCallback(async (accountId: string) => { await deleteClashAccount(accountId); await reload(); }, [reload]);
  const makePrimary = useCallback(async (accountId: string) => { await setPrimaryClashAccount(accountId); await reload(); }, [reload]);
  const activeAccount = accounts.find((account) => account.id === activeClashAccountId) ?? null;

  return useMemo(() => ({
    accounts, activeAccount, activeClashAccountId, setActiveClashAccountId,
    accountsLoading, accountsLoaded, accountsError, accountRequired: Boolean(userId && enabled && accountsLoaded && !accountsError && accounts.length === 0),
    limitReached: accounts.length >= MAX_FREE_CLASH_ACCOUNTS, maxAccounts: MAX_FREE_CLASH_ACCOUNTS,
    reload, create, update, remove, makePrimary,
  }), [accounts, activeAccount, activeClashAccountId, accountsError, accountsLoaded, accountsLoading, create, enabled, makePrimary, reload, remove, setActiveClashAccountId, update, userId]);
}

export type ClashAccountsState = ReturnType<typeof useClashAccounts>;
