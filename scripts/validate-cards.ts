import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { cards } from "../src/data/cards";
import { categories } from "../src/data/categories";
import type { CardCategory } from "../src/types/card";
import { normalizeText } from "../src/utils/normalizeText";
import cardsPtBr from "../src/i18n/locales/pt-BR/cards";
import cardsEn from "../src/i18n/locales/en/cards";

const expectedCounts: Record<CardCategory, number> = {
  elixir: 19,
  "dark-elixir": 13,
  "builder-base": 11,
  "super-troops": 17,
};
const provisionalIds = new Set([
  "barbarian", "archer", "giant", "goblin", "wizard", "dragon", "minion",
  "hog-rider", "valkyrie", "golem", "witch", "raged-barbarian",
  "sneaky-archer", "boxer-giant", "bomber", "super-barbarian",
  "super-archer", "super-giant", "super-wizard",
]);
const errors: string[] = [];
const checks: string[] = [];

function check(condition: boolean, message: string): void {
  if (condition) checks.push(message);
  else errors.push(message);
}

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  }));
  return nested.flat();
}

check(cards.length === 60, "O catálogo contém exatamente 60 cartas");
check(new Set(cards.map((card) => card.id)).size === cards.length, "Todos os IDs são globalmente únicos (chaves React seguras)");
check(new Set(cards.map((card) => card.image)).size === cards.length, "Todos os caminhos de imagem são únicos");
check(cards.every((card) => card.nameKey.trim().length > 0), "Nenhuma chave de nome está vazia");
check(cards.every((card) => card.nameKey === card.id), "Toda chave de tradução usa o ID estável da carta");
check(cards.every((card) => cardsPtBr[card.nameKey] && cardsEn[card.nameKey]), "Toda carta possui nome em pt-BR e en");
check(cards.every((card) => card.image.endsWith(".webp")), "Todos os caminhos terminam em .webp");
check(cards.every((card) => !card.image.includes("placeholder")), "Nenhuma carta aponta para o placeholder");
check(cards.every((card) => !provisionalIds.has(card.id)), "Nenhum ID provisório permanece no catálogo");

const validCategoryIds = new Set(categories.map((category) => category.id));
check(cards.every((card) => validCategoryIds.has(card.category)), "Todas as categorias são válidas");
check(cards.every((card) => card.id.startsWith(`${card.category}-`)), "Todos os IDs possuem o prefixo da categoria");

for (const category of categories) {
  const categoryCards = cards.filter((card) => card.category === category.id);
  check(categoryCards.length === expectedCounts[category.id], `${category.id}: ${expectedCounts[category.id]} cartas`);
  const orders = categoryCards.map((card) => card.order).sort((a, b) => a - b);
  check(orders.every((order, index) => order === index + 1), `${category.id}: ordens sequenciais de 1 a ${expectedCounts[category.id]}`);
}

const publicRoot = path.resolve("public");
for (const card of cards) {
  const absoluteImagePath = path.join(publicRoot, card.image.replace(/^\//, ""));
  try {
    const imageStats = await stat(absoluteImagePath);
    check(imageStats.isFile(), `Imagem encontrada: ${card.image}`);
    const signature = (await readFile(absoluteImagePath)).subarray(0, 12);
    check(
      signature.subarray(0, 4).toString("ascii") === "RIFF"
        && signature.subarray(8, 12).toString("ascii") === "WEBP",
      `WebP válido: ${card.image}`,
    );
  } catch {
    errors.push(`Imagem não encontrada: ${card.image}`);
  }
}

const categoryDirectories = categories.map((category) => path.join(publicRoot, "cards", category.id));
const physicalFiles = (await Promise.all(categoryDirectories.map(listFiles))).flat();
const physicalWebpPaths = physicalFiles
  .filter((file) => path.extname(file).toLowerCase() === ".webp")
  .map((file) => `/${path.relative(publicRoot, file).split(path.sep).join("/")}`)
  .sort();
const catalogImagePaths = cards.map((card) => card.image).sort();

check(physicalFiles.length === 60, "As quatro pastas contêm somente os 60 arquivos finais");
check(physicalWebpPaths.length === 60, "Existem fisicamente 60 imagens WebP");
check(JSON.stringify(physicalWebpPaths) === JSON.stringify(catalogImagePaths), "Todas as imagens físicas são usadas e não existem imagens extras");
check(normalizeText(cardsPtBr["elixir-barbarian"]).includes(normalizeText("barbaro")), "Busca encontra Bárbaro usando barbaro");
check(normalizeText(cardsPtBr["elixir-electro-titan"]).includes(normalizeText("tita eletrica")), "Busca encontra Titã Elétrica usando tita eletrica");
check(normalizeText(`${cardsPtBr["elixir-wall-breaker"]} ${cardsEn["elixir-wall-breaker"]}`).includes(normalizeText("wall breaker")), "Busca bilíngue encontra Wall Breaker em qualquer idioma");

if (errors.length) {
  console.error("\nValidação do catálogo falhou:\n");
  errors.forEach((error) => console.error(`  ✗ ${error}`));
  process.exitCode = 1;
} else {
  console.log(`✓ ${checks.length} verificações concluídas`);
  console.log("✓ Catálogo válido: 19 + 13 + 11 + 17 = 60 cartas");
  console.log("✓ 60 imagens WebP válidas, utilizadas uma única vez e sem arquivos extras");
}
