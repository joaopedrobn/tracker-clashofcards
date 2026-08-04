import type { ClashAccount } from "../types/clashAccount";

export const MAX_CLASH_ACCOUNTS = 5;
export const activeClashAccountStorageKey = (userId: string) => `clash-card-tracker-active-account:${userId}`;
export const accountCollectionCacheKey = (userId: string, accountId: string) => `clash-card-tracker-account-v2:${userId}:${accountId}`;

export function canAddClashAccount(accountCount: number): boolean { return accountCount < MAX_CLASH_ACCOUNTS; }

export function chooseActiveClashAccount(accounts: ClashAccount[], storedAccountId: string | null): ClashAccount | null {
  return accounts.find((account) => account.id === storedAccountId)
    ?? accounts.find((account) => account.isPrimary)
    ?? [...accounts].sort((a, b) => a.displayOrder - b.displayOrder)[0]
    ?? null;
}

export function nextActiveAccountAfterDelete(accounts: ClashAccount[], deletedAccountId: string): ClashAccount | null {
  return chooseActiveClashAccount(accounts.filter((account) => account.id !== deletedAccountId), null);
}
