import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { getAvatarByUrl, getDefaultAvatar, isAllowedAvatarUrl, PROFILE_AVATARS } from "../src/data/avatars";
import profileEn from "../src/i18n/locales/en/profile";
import profilePtBr from "../src/i18n/locales/pt-BR/profile";

const avatarDirectory = path.resolve("public", "avatars");
const entries = await readdir(avatarDirectory, { withFileTypes: true });
const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
const errors: string[] = [];
const checks: string[] = [];
const check = (condition: boolean, message: string) => condition ? checks.push(message) : errors.push(message);
const filePattern = /^avatar-([1-9]\d*)\.webp$/;

check(files.every((file) => path.extname(file) === ".webp"), "Todos os arquivos são WebP");
check(files.every((file) => filePattern.test(file)), "Todos os nomes seguem avatar-N.webp com inteiro positivo");
check(files.every((file) => !/\s/.test(file)), "Nenhum arquivo possui espaço");
check(files.every((file) => file === file.toLowerCase()), "Nenhum arquivo possui letras maiúsculas");

const physicalNumbers = files.map((file) => Number(file.match(filePattern)?.[1])).filter(Number.isInteger);
check(new Set(physicalNumbers).size === physicalNumbers.length, "Nenhum número físico está repetido");
check(new Set(PROFILE_AVATARS.map((avatar) => avatar.id)).size === PROFILE_AVATARS.length, "Todos os IDs são únicos");
check(new Set(PROFILE_AVATARS.map((avatar) => avatar.image)).size === PROFILE_AVATARS.length, "Todos os caminhos são únicos");
check(PROFILE_AVATARS.every((avatar) => avatar.order > 0 && Number.isInteger(avatar.order)), "Todas as ordens são inteiros positivos");
check(PROFILE_AVATARS.every((avatar) => avatar.id === `avatar-${avatar.order}` && avatar.image === `/avatars/avatar-${avatar.order}.webp`), "IDs, caminhos e ordens são consistentes");
check(PROFILE_AVATARS.every((avatar, index) => index === 0 || PROFILE_AVATARS[index - 1].order < avatar.order), "Catálogo está ordenado numericamente");
check(PROFILE_AVATARS.every((avatar) => avatar.image.startsWith("/avatars/")), "Todos os caminhos começam com /avatars/");

const physicalPaths = files.map((file) => `/avatars/${file}`).sort((a, b) => Number(a.match(/\d+/)?.[0]) - Number(b.match(/\d+/)?.[0]));
const catalogPaths = PROFILE_AVATARS.map((avatar) => avatar.image);
check(JSON.stringify(physicalPaths) === JSON.stringify(catalogPaths), "Arquivos físicos e catálogo correspondem exatamente");

for (const file of files) {
  const signature = (await readFile(path.join(avatarDirectory, file))).subarray(0, 12);
  check(signature.subarray(0, 4).toString("ascii") === "RIFF" && signature.subarray(8, 12).toString("ascii") === "WEBP", `WebP válido: ${file}`);
}

for (const invalid of ["https://site.com/avatar.png", "data:image/webp;base64,AAAA", "javascript:alert(1)", "file:///avatar.webp", "C:\\imagem.webp", "/avatars/avatar-999.webp", "avatar-1"]) {
  check(!isAllowedAvatarUrl(invalid), `Valor externo ou ausente rejeitado: ${invalid}`);
  check(getAvatarByUrl(invalid) === undefined, `Fallback ativado para: ${invalid}`);
}
check(getDefaultAvatar()?.image === PROFILE_AVATARS[0]?.image, "Fallback padrão usa o primeiro avatar cadastrado");

const requiredTranslationKeys = ["chooseAvatar", "avatarDescription", "avatarOption", "avatarSelected", "noAvatars", "profileAvatar", "avatarOf", "avatarFallback", "invalidAvatarFallback"] as const;
check(requiredTranslationKeys.every((key) => Boolean(profilePtBr[key])), "Chaves de avatar existem em português");
check(requiredTranslationKeys.every((key) => Boolean(profileEn[key])), "Chaves de avatar existem em inglês");
check(Boolean(profilePtBr.validation.avatarRequired && profilePtBr.validation.avatarInvalid), "Erros de avatar existem em português");
check(Boolean(profileEn.validation.avatarRequired && profileEn.validation.avatarInvalid), "Erros de avatar existem em inglês");

if (errors.length) {
  console.error("Validação de avatares falhou:\n");
  errors.forEach((error) => console.error(`  × ${error}`));
  process.exitCode = 1;
} else {
  console.log(`✓ ${PROFILE_AVATARS.length} avatares WebP válidos e ordenados numericamente`);
  console.log(`✓ ${checks.length} verificações de arquivos, catálogo, segurança, fallback e traduções`);
}
