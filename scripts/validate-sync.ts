import assert from "node:assert/strict";
import { migrateCollectionData } from "../src/services/collectionMigration";
import { collectionCardsEqual, mergeCollections } from "../src/services/localCollectionMerge";
import { normalizeClashTag, validateProfile } from "../src/services/profileService";
import { shouldRequireProfile } from "../src/services/profileGate";
import { calculateTradeOpportunitySummary } from "../src/services/tradeComparison";
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
assert.equal(validateProfile({
  displayName: " Jogador ", clashNickname: " Nick ", clashPlayerTag: "abc123",
  clanName: " Clã ", clanTag: " clan99 ", bio: " Bio ", avatarUrl: "/avatars/avatar-1.webp", isPublic: true,
}).clanTag, "#CLAN99");
assert.throws(() => normalizeClashTag("#A", true));
assert.throws(() => validateProfile({ displayName: "Jogador", clashNickname: "Nick", clashPlayerTag: "ABC123", clanName: "", clanTag: "", bio: "", avatarUrl: "https://site.com/avatar.png", isPublic: true }), "avatar externo deve ser rejeitado");

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

console.log("✓ Mesclagem, migração, perfil/avatar, limpeza seletiva e oportunidades de troca validados");
