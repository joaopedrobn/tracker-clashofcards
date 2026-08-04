import assert from "node:assert/strict";
import { migrateCollectionData } from "../src/services/collectionMigration";
import { collectionCardsEqual, mergeCollections } from "../src/services/localCollectionMerge";
import { normalizeClashTag, validateProfile } from "../src/services/profileService";
import { validateClashAccount } from "../src/services/clashAccountService";
import { accountCollectionCacheKey, activeClashAccountStorageKey, canAddClashAccount, chooseActiveClashAccount, nextActiveAccountAfterDelete } from "../src/services/clashAccountState";
import { shouldRequireProfile } from "../src/services/profileGate";
import { calculateAccountTradeSummary, calculateSelectedAccountTradeSummary, calculateTradeOpportunitySummary, compareAllAccounts } from "../src/services/tradeComparison";
import type { ClashAccount, ClashAccountCollection } from "../src/types/clashAccount";
import type { CollectionData } from "../src/types/collection";
import { clearCollectionCards } from "../src/services/collectionClear";

const base: CollectionData = {
  version: 2,
  playerName: "Teste",
  updatedAt: "2026-08-03T12:00:00.000Z",
  cards: {},
  preferences: { category: "all", filter: "all" },
};

const local: CollectionData = {
  ...base,
  cards: {
    "elixir-barbarian": { owned: true, duplicates: 2 },
    "elixir-archer": { owned: true, duplicates: 0 },
    "id-inexistente": { owned: true, duplicates: 99 },
  },
};
const remote: CollectionData = {
  ...base,
  cards: {
    "elixir-barbarian": { owned: true, duplicates: 1 },
    "elixir-giant": { owned: false, duplicates: 3 },
  },
};

const merged = mergeCollections(local, remote);
assert.equal(merged.cards["elixir-barbarian"].duplicates, 2, "a mesclagem deve usar o maior valor, sem somar");
assert.equal(merged.cards["elixir-archer"].owned, true, "a mesclagem deve preservar cartas locais");
assert.equal(merged.cards["elixir-giant"].owned, true, "repetidas implicam carta obtida");
assert.equal(merged.cards["id-inexistente"], undefined, "IDs fora do catálogo devem ser ignorados");
assert.equal(collectionCardsEqual(merged, merged), true);

const migrated = migrateCollectionData({
  version: 1,
  playerName: "Legado",
  updatedAt: "2026-08-03T10:00:00.000Z",
  cards: { barbarian: { owned: true, duplicates: 1 }, desconhecida: { owned: true } },
  preferences: { category: "elixir", filter: "owned" },
});
assert.equal(migrated.cards["elixir-barbarian"].duplicates, 1, "IDs CCT1 devem migrar");
assert.equal(migrated.cards.desconhecida, undefined, "IDs legados desconhecidos devem ser descartados");
assert.equal(migrated.updatedAt, "2026-08-03T10:00:00.000Z");

assert.equal(normalizeClashTag("  ##abc123  ", true), "#ABC123");
assert.equal(validateProfile({ displayName: " Jogador ", bio: " Bio ", avatarUrl: "/avatars/avatar-1.webp", isPublic: true }).displayName, "Jogador");
assert.equal(validateClashAccount({ accountLabel: " Principal ", clashNickname: " Nick ", clashPlayerTag: "abc123", clanName: " Clã ", clanTag: " clan99 ", avatarUrl: "/avatars/avatar-1.webp" }).clanTag, "#CLAN99");
assert.throws(() => normalizeClashTag("#A", true));
assert.throws(() => validateProfile({ displayName: "Jogador", bio: "", avatarUrl: "https://site.com/avatar.png", isPublic: true }), "avatar externo deve ser rejeitado");

const cleared = clearCollectionCards(local, "2026-08-03T13:00:00.000Z");
assert.deepEqual(cleared.cards, {}, "limpar coleção deve remover somente as cartas");
assert.deepEqual(cleared.preferences, local.preferences, "limpar coleção deve preservar preferências");
assert.equal(cleared.playerName, local.playerName, "limpar coleção deve preservar o nome armazenado");

const gateBase = {
  userId: "user-1",
  authLoading: false,
  profileLoading: false,
  profileLoaded: true,
  profile: null,
  profileError: "",
};
assert.equal(shouldRequireProfile({ ...gateBase, authLoading: true }), false, "não abre durante restauração da sessão");
assert.equal(shouldRequireProfile({ ...gateBase, profileLoading: true, profileLoaded: false }), false, "não abre durante consulta do perfil");
assert.equal(shouldRequireProfile({ ...gateBase, profileLoaded: false }), false, "null transitório não significa perfil ausente");
assert.equal(shouldRequireProfile({ ...gateBase, profileError: "falha" }), false, "erro de consulta não significa perfil ausente");
assert.equal(shouldRequireProfile({ ...gateBase, profile: { id: "user-1" } as never }), false, "perfil existente não abre o formulário");
assert.equal(shouldRequireProfile(gateBase), true, "abre somente após consulta concluída sem perfil");

const tradeMine: CollectionData = {
  ...base,
  cards: {
    "elixir-barbarian": { owned: true, duplicates: 2 },
    "elixir-archer": { owned: false, duplicates: 0 },
  },
};
const tradeTheirs: CollectionData = {
  ...base,
  cards: {
    "elixir-barbarian": { owned: false, duplicates: 0 },
    "elixir-archer": { owned: true, duplicates: 3 },
  },
};
assert.deepEqual(calculateTradeOpportunitySummary(tradeMine, tradeTheirs), {
  theyCanOfferCount: 1,
  iCanOfferCount: 1,
}, "o resumo da comunidade deriva as oportunidades das duas coleções sem consultas extras");

const makeAccount = (id: string, isPrimary: boolean, displayOrder: number): ClashAccount => ({ id, ownerId: "owner", accountLabel: id, clashNickname: id, clashPlayerTag: `#${id.toUpperCase()}12345`, clanName: null, clanTag: null, avatarUrl: "/avatars/avatar-1.webp", isPrimary, displayOrder, createdAt: base.updatedAt!, updatedAt: base.updatedAt! });
const accounts = [makeAccount("secondary", false, 1), makeAccount("primary", true, 0)];
assert.equal(chooseActiveClashAccount(accounts, null)?.id, "primary", "usuário antigo deve abrir a conta principal migrada");
assert.equal(chooseActiveClashAccount(accounts, "secondary")?.id, "secondary", "a conta ativa persistida deve sobreviver ao reload");
assert.equal(nextActiveAccountAfterDelete(accounts, "primary")?.id, "secondary", "a exclusão deve selecionar outra conta");
assert.equal(canAddClashAccount(4), true); assert.equal(canAddClashAccount(5), false, "a sexta conta deve ser bloqueada na interface");
assert.notEqual(accountCollectionCacheKey("u1", "a1"), accountCollectionCacheKey("u1", "a2"), "cada conta precisa de cache isolado");
assert.notEqual(activeClashAccountStorageKey("u1"), activeClashAccountStorageKey("u2"), "a preferência ativa deve ser isolada por usuário");

const wrap = (account: ClashAccount, collection: CollectionData): ClashAccountCollection => ({ account, collection, summary: { collected: 0, total: 60, percentage: 0, missing: 60, duplicateTypes: 0, duplicateCopies: 0 } });
const allTrades = compareAllAccounts([wrap(accounts[0], tradeMine)], [wrap({ ...accounts[1], ownerId: "other" }, tradeTheirs)]);
assert.deepEqual(allTrades.theirsForMe.map((item) => item.cardId), ["elixir-archer"]);
assert.deepEqual(allTrades.mineForThem.map((item) => item.cardId), ["elixir-barbarian"]);
assert.equal(new Set(allTrades.theirsForMe.map((item) => `${item.cardId}:${item.sourceAccountId}:${item.targetAccountId}`)).size, allTrades.theirsForMe.length, "oportunidades exatas não podem ser duplicadas");

const myAccountA = makeAccount("my-a", true, 0);
const myAccountB = makeAccount("my-b", false, 1);
const otherAccount1 = { ...makeAccount("other-1", true, 0), ownerId: "other" };
const otherAccount2 = { ...makeAccount("other-2", false, 1), ownerId: "other" };
const myCollections = {
  [myAccountA.id]: { ...base, cards: { "elixir-barbarian": { owned: false, duplicates: 0 }, "elixir-wizard": { owned: true, duplicates: 2 } } },
  [myAccountB.id]: { ...base, cards: { "elixir-barbarian": { owned: true, duplicates: 0 }, "elixir-wizard": { owned: false, duplicates: 0 }, "dark-elixir-hog-rider": { owned: true, duplicates: 1 } } },
};
const otherCollections = {
  [otherAccount1.id]: { ...base, cards: { "elixir-barbarian": { owned: true, duplicates: 2 }, "elixir-wizard": { owned: false, duplicates: 0 } } },
  [otherAccount2.id]: { ...base, cards: { "dark-elixir-hog-rider": { owned: false, duplicates: 0 } } },
};
assert.deepEqual(calculateAccountTradeSummary(myAccountA.id, myCollections, [otherAccount1, otherAccount2], otherCollections), { theyCanOfferCount: 1, iCanOfferCount: 1 }, "a conta A deve receber Bárbaro e oferecer Mago");
assert.deepEqual(calculateAccountTradeSummary(myAccountB.id, myCollections, [otherAccount1, otherAccount2], otherCollections), { theyCanOfferCount: 0, iCanOfferCount: 1 }, "a conta B deve oferecer Corredor sem recarregar dados externos");
const selectedOtherCollections = {
  ...otherCollections,
  [otherAccount2.id]: { ...base, cards: { "elixir-barbarian": { owned: true, duplicates: 0 }, "elixir-wizard": { owned: true, duplicates: 0 }, "dark-elixir-hog-rider": { owned: true, duplicates: 1 } } },
};
assert.deepEqual(calculateSelectedAccountTradeSummary(myAccountA.id, myCollections, otherAccount1.id, selectedOtherCollections), { theyCanOfferCount: 1, iCanOfferCount: 1 }, "a seleção da conta principal deve comparar apenas o par escolhido");
assert.deepEqual(calculateSelectedAccountTradeSummary(myAccountA.id, myCollections, otherAccount2.id, selectedOtherCollections), { theyCanOfferCount: 1, iCanOfferCount: 0 }, "trocar apenas a conta do outro jogador deve recalcular o card para 1/0");

console.log("✓ Mesclagem, migração, perfil/avatar, limpeza seletiva e oportunidades de troca validados");
