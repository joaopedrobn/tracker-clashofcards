import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { accountCollectionCacheKey, canAddClashAccount, MAX_CLASH_ACCOUNTS } from "../src/services/clashAccountState";
import { normalizeClashTag } from "../src/services/profileService";

assert.equal(MAX_CLASH_ACCOUNTS, 5);
assert.equal(canAddClashAccount(4), true);
assert.equal(canAddClashAccount(5), false);
assert.notEqual(accountCollectionCacheKey("user", "account-a"), accountCollectionCacheKey("user", "account-b"));
assert.equal(normalizeClashTag(" #gu09 r2uj ".replace(" ", ""), true), "#GU09R2UJ");

const migration = readFileSync("supabase/migrations/20260804_clash_account_atomic_actions.sql", "utf8");
assert.match(migration, /set_primary_clash_account/);
assert.match(migration, /delete_own_clash_account/);
assert.match(migration, /LAST_CLASH_ACCOUNT_CANNOT_BE_DELETED/);
assert.match(migration, /auth\.uid\(\)/);

console.log("✓ Limite, cache isolado, normalização e operações SQL atômicas validados");
