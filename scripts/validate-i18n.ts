import { cards } from "../src/data/cards";
import { categories } from "../src/data/categories";
import { namespaces, resources } from "../src/i18n/resources";

const errors: string[] = [];

function flatten(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, nested]) => flatten(nested, prefix ? `${prefix}.${key}` : key));
}

for (const namespace of namespaces) {
  const ptKeys = flatten(resources["pt-BR"][namespace]).sort();
  const enKeys = flatten(resources.en[namespace]).sort();
  if (JSON.stringify(ptKeys) !== JSON.stringify(enKeys)) {
    const missingPt = enKeys.filter((key) => !ptKeys.includes(key));
    const missingEn = ptKeys.filter((key) => !enKeys.includes(key));
    if (missingPt.length) errors.push(`${namespace}: ausentes em pt-BR: ${missingPt.join(", ")}`);
    if (missingEn.length) errors.push(`${namespace}: missing in en: ${missingEn.join(", ")}`);
  }
}

const ptCards = resources["pt-BR"].cards as Record<string, string>;
const enCards = resources.en.cards as Record<string, string>;
const catalogIds = cards.map((card) => card.id).sort();
const ptIds = Object.keys(ptCards).sort();
const enIds = Object.keys(enCards).sort();
if (cards.length !== 60) errors.push(`Catálogo possui ${cards.length} cartas em vez de 60.`);
if (JSON.stringify(catalogIds) !== JSON.stringify(ptIds)) errors.push("As chaves pt-BR das cartas não correspondem exatamente ao catálogo.");
if (JSON.stringify(catalogIds) !== JSON.stringify(enIds)) errors.push("The English card keys do not match the catalog exactly.");
if (cards.some((card) => card.nameKey !== card.id)) errors.push("Uma ou mais nameKey não usam o ID estável da carta.");
if ([...Object.values(ptCards), ...Object.values(enCards)].some((name) => !name.trim())) errors.push("Existe nome de carta vazio.");

const collectionPt = resources["pt-BR"].collection as Record<string, unknown>;
const collectionEn = resources.en.collection as Record<string, unknown>;
const ptCollectionKeys = new Set(flatten(collectionPt));
const enCollectionKeys = new Set(flatten(collectionEn));
for (const category of categories) {
  for (const key of [category.nameKey, category.shortNameKey, category.descriptionKey]) {
    if (!ptCollectionKeys.has(key)) errors.push(`Categoria sem tradução pt-BR: ${key}`);
    if (!enCollectionKeys.has(key)) errors.push(`Category missing English translation: ${key}`);
  }
}

if (errors.length) {
  console.error("Validação de i18n falhou:\n");
  errors.forEach((error) => console.error(`  × ${error}`));
  process.exitCode = 1;
} else {
  console.log(`✓ ${namespaces.length} namespaces possuem as mesmas chaves em pt-BR e en`);
  console.log("✓ As 60 cartas e as 4 categorias possuem traduções completas");
  console.log("✓ IDs, nameKey e formato persistido do catálogo permanecem estáveis");
}
