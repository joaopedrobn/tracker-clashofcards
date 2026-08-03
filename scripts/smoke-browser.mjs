import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const appUrl = process.argv[2] ?? "http://127.0.0.1:4173";
const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9300 + Math.floor(Math.random() * 300);
const profileDir = join(tmpdir(), `cct-smoke-${Date.now()}`);
const outputDir = resolve("artifacts");
await mkdir(outputDir, { recursive: true });
const chromeProcess = spawn(
  chrome,
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--disable-default-apps",
    "--disable-extensions",
    "--window-size=1440,1000",
    appUrl,
  ],
  { stdio: "ignore", windowsHide: true },
);

const delay = (milliseconds) =>
  new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
async function fetchJson(url) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      /* wait for Chrome */
    }
    await delay(100);
  }
  throw new Error("Chrome headless did not start in time.");
}

try {
  const targets = await fetchJson(`http://127.0.0.1:${port}/json/list`);
  const target = targets.find((item) => item.type === "page");
  assert.ok(target?.webSocketDebuggerUrl, "smoke-test tab was not found");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener("open", resolveOpen, { once: true });
    socket.addEventListener("error", rejectOpen, { once: true });
  });
  let commandId = 0;
  const pending = new Map();
  const runtimeErrors = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown")
      runtimeErrors.push(message.params.exceptionDetails.text);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve: resolveCommand, reject: rejectCommand } = pending.get(
      message.id,
    );
    pending.delete(message.id);
    if (message.error) rejectCommand(new Error(message.error.message));
    else resolveCommand(message.result);
  });
  const send = (method, params = {}) =>
    new Promise((resolveCommand, rejectCommand) => {
      const id = ++commandId;
      pending.set(id, { resolve: resolveCommand, reject: rejectCommand });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      try {
        if (await evaluate(expression)) return;
      } catch {
        /* navigation can replace the execution context */
      }
      await delay(100);
    }
    throw new Error(`State not found: ${expression}`);
  };
  const screenshot = async (name) => {
    const result = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    await writeFile(join(outputDir, name), Buffer.from(result.data, "base64"));
  };
  const setViewport = (width, height, mobile = false) =>
    send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });
  const assertNoHorizontalOverflow = async (width, context) => {
    await setViewport(width, width < 768 ? 844 : 1000, width < 768);
    await delay(80);
    const dimensions = await evaluate(
      "({ viewport: window.innerWidth, root: document.documentElement.scrollWidth, body: document.body.scrollWidth })",
    );
    assert.ok(
      dimensions.root <= dimensions.viewport &&
        dimensions.body <= dimensions.viewport,
      `${context} at ${width}px has horizontal overflow: ${JSON.stringify(dimensions)}`,
    );
  };
  const installFakeSession = async () => {
    const source = await readFile(resolve(".env.local"), "utf8");
    const url = source.match(/^VITE_SUPABASE_URL=(.+)$/m)?.[1]?.trim();
    assert.ok(
      url,
      "VITE_SUPABASE_URL is required for the authenticated header smoke fixture",
    );
    const projectRef = new URL(url).hostname.split(".")[0];
    const encode = (value) =>
      Buffer.from(JSON.stringify(value)).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    const userId = "00000000-0000-4000-8000-000000000042";
    const accessToken = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ aud: "authenticated", exp: now + 3600, iat: now, role: "authenticated", sub: userId, email: "responsive-smoke@example.invalid" })}.${Buffer.from("smoke").toString("base64url")}`;
    const user = {
      id: userId,
      aud: "authenticated",
      role: "authenticated",
      email: "responsive-smoke@example.invalid",
      email_confirmed_at: new Date().toISOString(),
      phone: "",
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {},
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const session = {
      access_token: accessToken,
      refresh_token: "responsive-smoke-refresh",
      expires_in: 3600,
      expires_at: now + 3600,
      token_type: "bearer",
      user,
    };
    await evaluate(
      `localStorage.setItem(${JSON.stringify(`sb-${projectRef}-auth-token`)}, ${JSON.stringify(JSON.stringify(session))}); true`,
    );
    return {
      user,
      profile: {
        id: userId,
        display_name: "Responsive Smoke",
        clash_nickname: "Smoke",
        clash_player_tag: "#TEST123",
        clan_name: null,
        clan_tag: null,
        bio: null,
        avatar_url: "/avatars/avatar-1.webp",
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_collection_update: null,
      },
    };
  };
  const setInput = (selector, value) =>
    evaluate(
      `(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) return false; const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; setter.call(element, ${JSON.stringify(value)}); element.dispatchEvent(new Event("input", { bubbles: true })); element.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`,
    );
  const clickButton = (label) =>
    evaluate(
      `(() => { const button = [...document.querySelectorAll("button")].find((item) => item.textContent.trim() === ${JSON.stringify(label)} || item.getAttribute("aria-label") === ${JSON.stringify(label)}); if (!button) return false; button.click(); return true; })()`,
    );

  await send("Page.enable");
  await send("Runtime.enable");
  await setViewport(1440, 1000);
  await waitFor("document.body?.innerText.length > 100");
  await evaluate(
    "localStorage.setItem('clash-card-tracker-language', 'pt-BR'); sessionStorage.clear(); location.reload(); true",
  );
  await waitFor(
    "document.documentElement.lang === 'pt-BR' && document.body?.innerText.includes('Cartas do álbum')",
  );
  await waitFor(
    "document.body.innerText.includes('Você está usando o modo sem conta')",
  );
  assert.equal(
    await evaluate(
      "document.body.innerText.includes('Você está usando o modo sem conta')",
    ),
    true,
  );
  assert.equal(
    await evaluate("document.body.innerText.includes('60 exibidas')"),
    true,
  );
  assert.equal(
    await evaluate(
      "document.body.innerText.includes('ÁLBUM DO EVENTO · CLASH CARTEADOR')",
    ),
    true,
  );
  assert.equal(
    await evaluate(
      "document.querySelector('link[rel=icon]')?.href.endsWith('/logo/icon-guia.webp')",
    ),
    true,
  );
  assert.equal(
    await evaluate("document.querySelector('header img')?.naturalWidth > 0"),
    true,
  );
  assert.equal(
    await evaluate(
      "document.querySelector('meta[property=\"og:title\"]')?.content.length > 0 && document.querySelector('meta[property=\"og:description\"]')?.content.length > 0 && document.querySelector('meta[property=\"og:image\"]')?.content.endsWith('/logo/icon-guia.webp')",
    ),
    true,
  );
  assert.equal(
    await evaluate(
      "document.querySelector('link[rel=manifest]')?.href.endsWith('/site.webmanifest')",
    ),
    true,
  );
  assert.equal(
    await evaluate(
      "fetch('/site.webmanifest').then((response) => response.json()).then((manifest) => manifest.name === 'Clash of Cards Tracker' && manifest.icons[0].src === '/logo/icon-clash.webp')",
    ),
    true,
  );
  assert.equal(
    await evaluate(
      "document.querySelector('.exchange-preview')?.innerText.includes('MINHA COLEÇÃO')",
    ),
    true,
  );
  assert.equal(
    await evaluate(
      "!document.querySelector('button[aria-label=\"Abrir configurações\"]') && !document.querySelector('button[aria-label=\"Open settings\"]')",
    ),
    true,
  );
  assert.equal(
    await evaluate(
      "document.querySelector('nav a[href=\"/\"]')?.innerText.includes('Coleção') && document.querySelector('nav a[href=\"/comunidade\"]')?.innerText.includes('Comunidade')",
    ),
    true,
  );
  for (const width of [320, 360, 375, 390, 412, 430, 480, 768, 1024])
    await assertNoHorizontalOverflow(width, "guest collection");
  await setViewport(1440, 1000);
  await screenshot("smoke-pt-desktop.png");

  await evaluate(
    "document.querySelector('article button[aria-label*=" +
      '"Clique para alterar"' +
      "]')?.click(); document.querySelector('button[aria-label^=" +
      '"Aumentar repetidas"' +
      "]')?.click(); true",
  );
  await waitFor(
    "JSON.parse(localStorage.getItem('clash-card-tracker-v1')).cards['elixir-barbarian']?.duplicates === 1",
  );
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('button[aria-label=\"Dados da coleção\"]'))",
    ),
    true,
  );
  assert.equal(await clickButton("Dados da coleção"), true);
  await waitFor(
    "document.body.innerText.includes('Exportar coleção') && document.body.innerText.includes('Importar coleção') && document.body.innerText.includes('Limpar coleção')",
  );
  await screenshot("smoke-collection-data-pt.png");
  assert.equal(await clickButton("Limpar coleção"), true);
  await waitFor(
    "document.body.innerText.includes('Isso removerá todas as cartas obtidas e repetidas da sua coleção.') && document.body.innerText.includes('Seu perfil e sua conta não serão apagados.')",
  );
  assert.equal(
    await evaluate(
      "Boolean([...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Sim, limpar coleção'))",
    ),
    true,
  );
  await screenshot("smoke-clear-confirmation-pt.png");
  assert.equal(await clickButton("Cancelar"), true);
  await waitFor(
    "!document.body.innerText.includes('Seu perfil e sua conta não serão apagados.')",
  );
  await evaluate(
    "document.querySelector('[role=dialog] button[aria-label=\"Fechar\"]')?.click(); true",
  );

  assert.equal(
    await setInput("input[placeholder='Buscar por tropa...']", "Root Rider"),
    true,
  );
  await waitFor(
    "document.body.innerText.includes('Poderosa Hera') && document.body.innerText.includes('1 exibidas')",
  );
  assert.equal(await clickButton("Limpar busca"), true);
  await waitFor("document.body.innerText.includes('60 exibidas')");
  assert.equal(await clickButton("Fechar aviso do modo sem conta"), true);
  await waitFor(
    "!document.body.innerText.includes('Você está usando o modo sem conta')",
  );
  assert.equal(
    await evaluate("sessionStorage.getItem('cct-guest-notice-dismissed')"),
    "1",
  );

  assert.equal(
    await clickButton("Selecionar idioma: Português do Brasil"),
    true,
  );
  await waitFor(
    "document.querySelector('[role=menu]')?.innerText.includes('English')",
  );
  assert.equal(await clickButton("English"), true);
  await waitFor(
    "document.documentElement.lang === 'en' && document.body.innerText.includes('Album cards')",
  );
  assert.equal(
    await evaluate("localStorage.getItem('clash-card-tracker-language')"),
    "en",
  );
  assert.equal(
    await evaluate(
      "document.body.innerText.includes('EVENT ALBUM · CLASH CARTEADOR')",
    ),
    true,
  );
  assert.equal(
    await evaluate(
      "document.querySelector('.exchange-preview')?.innerText.includes('MY COLLECTION')",
    ),
    true,
  );
  assert.equal(
    await setInput("input[placeholder='Search troops...']", "Poderosa Hera"),
    true,
  );
  await waitFor(
    "document.body.innerText.includes('Root Rider') && document.body.innerText.includes('1 shown')",
  );
  assert.equal(await clickButton("Clear search"), true);
  await screenshot("smoke-en-desktop.png");

  assert.equal(await clickButton("Sign in"), true);
  await waitFor("document.body.innerText.includes('Forgot my password')");
  assert.equal(
    await evaluate(
      "(() => { const email = document.querySelector('input[type=email]'); const password = document.querySelector('input[type=password]'); return email?.name === 'email' && email.autocomplete === 'username' && email.inputMode === 'email' && email.autocapitalize === 'none' && password?.name === 'password' && password.autocomplete === 'current-password'; })()",
    ),
    true,
  );
  assert.equal(
    await evaluate(
      "(() => { const input = document.querySelector('input[type=email]'); const icon = input?.parentElement?.querySelector('.input-icon'); if (!input || !icon) return false; const padding = parseFloat(getComputedStyle(input).paddingLeft); const inputBox = input.getBoundingClientRect(); const iconBox = icon.getBoundingClientRect(); return padding >= 40 && iconBox.right < inputBox.left + padding; })()",
    ),
    true,
  );
  assert.equal(await clickButton("Forgot my password"), true);
  await waitFor("document.body.innerText.includes('Reset password')");
  assert.equal(
    await evaluate("document.querySelector('input[type=email]')?.autocomplete"),
    "email",
  );
  assert.equal(await clickButton("Back to sign in"), true);
  await waitFor("document.body.innerText.includes('Forgot my password')");
  assert.equal(await clickButton("Create account"), true);
  await waitFor(
    "document.querySelectorAll('input[autocomplete=new-password]').length === 2",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('input[name=password-confirmation]')?.autocomplete",
    ),
    "new-password",
  );
  assert.equal(
    await evaluate(
      "(() => { const button = [...document.querySelectorAll('button')].find((item) => item.textContent.trim() === 'Back to sign in'); return Boolean(button && getComputedStyle(button).backgroundImage === 'none'); })()",
    ),
    true,
  );
  await setInput("input[type=email]", "smoke@example.invalid");
  await evaluate(
    `(() => { const passwords = document.querySelectorAll('input[type=password]'); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(passwords[0], '12345678'); passwords[0].dispatchEvent(new Event('input', { bubbles: true })); setter.call(passwords[1], '87654321'); passwords[1].dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('form').requestSubmit(); return true; })()`,
  );
  await waitFor("document.body.innerText.includes('Passwords do not match')");
  await screenshot("smoke-en-auth-desktop.png");
  assert.equal(await clickButton("Close"), true);

  await evaluate(
    "document.querySelector('a[href=\"/comunidade\"]')?.click(); true",
  );
  await waitFor(
    "location.pathname === '/comunidade' && document.body.innerText.includes('Community')",
  );
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector(\"input[aria-label='Search player, tag or clan']\"))",
    ),
    true,
  );
  await waitFor("!document.body.innerText.includes('Loading players...')");
  await evaluate("window.scrollTo(0, 0); true");
  assert.equal(
    await evaluate("document.documentElement.scrollWidth <= window.innerWidth"),
    true,
  );
  assert.equal(
    await evaluate(
      "(() => { const card = document.querySelector('article'); return !card || Boolean(card.querySelector('img[alt*=avatar], [role=img]')); })()",
    ),
    true,
  );
  for (const width of [320, 360, 375, 390, 412, 430, 480, 768, 1024])
    await assertNoHorizontalOverflow(width, "guest community");
  await setViewport(1440, 1000);
  await screenshot("smoke-en-community-desktop.png");

  if (
    await evaluate("Boolean(document.querySelector('a[href^=\"/jogador/\"]'))")
  ) {
    await evaluate(
      "document.querySelector('a[href^=\"/jogador/\"]')?.click(); true",
    );
    await waitFor("location.pathname.startsWith('/jogador/')");
    await waitFor("!document.body.innerText.includes('Loading profile...')");
    assert.equal(
      await evaluate(
        "document.body.innerText.toLowerCase().includes('public profile')",
      ),
      true,
      await evaluate("document.body.innerText.slice(0, 500)"),
    );
    assert.equal(
      await evaluate(
        "Boolean(document.querySelector('section img[alt*=avatar], section [role=img]'))",
      ),
      true,
    );
    assert.equal(
      await evaluate(
        "document.documentElement.scrollWidth <= window.innerWidth",
      ),
      true,
    );
    for (const width of [320, 360, 375, 390, 412, 430, 480, 768, 1024])
      await assertNoHorizontalOverflow(width, "guest public profile");
    await setViewport(1440, 1000);
    await screenshot("smoke-en-public-profile.png");
  }

  await setViewport(390, 844, true);
  await evaluate(
    "localStorage.setItem('clash-card-tracker-language', 'en'); sessionStorage.clear(); location.href = '/'; true",
  );
  await waitFor(
    "location.pathname === '/' && document.documentElement.lang === 'en' && document.body.innerText.includes('Album cards')",
  );
  assert.equal(
    await evaluate("document.documentElement.scrollWidth <= window.innerWidth"),
    true,
  );
  assert.equal(
    await evaluate(
      "Boolean(document.querySelector('button[aria-label=\"Open tools\"]'))",
    ),
    true,
  );
  assert.equal(await clickButton("Open tools"), true);
  await waitFor(
    "document.querySelector('[role=menu]')?.innerText.includes('Collection data')",
  );
  await screenshot("smoke-en-mobile.png");

  await evaluate(
    "localStorage.setItem('clash-card-tracker-language', 'pt-BR'); location.reload(); true",
  );
  await waitFor(
    "document.documentElement.lang === 'pt-BR' && document.body.innerText.includes('Cartas do álbum')",
  );
  assert.equal(
    await evaluate("document.documentElement.scrollWidth <= window.innerWidth"),
    true,
  );
  await screenshot("smoke-pt-mobile.png");

  const fakeFixture = await installFakeSession();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method !== "Fetch.requestPaused") return;
    void (async () => {
      const url = message.params.request.url;
      let payload;
      if (url.includes("/auth/v1/user")) payload = fakeFixture.user;
      else if (url.includes("/rest/v1/profiles")) payload = fakeFixture.profile;
      else if (url.includes("/rest/v1/user_cards")) payload = [];
      else
        return send("Fetch.continueRequest", {
          requestId: message.params.requestId,
        });
      await send("Fetch.fulfillRequest", {
        requestId: message.params.requestId,
        responseCode: 200,
        responseHeaders: [
          { name: "content-type", value: "application/json" },
          { name: "access-control-allow-origin", value: "*" },
        ],
        body: Buffer.from(JSON.stringify(payload)).toString("base64"),
      });
    })().catch(() => undefined);
  });
  await send("Fetch.enable", {
    patterns: [
      { urlPattern: "*://*/auth/v1/*", requestStage: "Request" },
      { urlPattern: "*://*/rest/v1/*", requestStage: "Request" },
    ],
  });
  await evaluate(
    "(() => { const stored = JSON.parse(localStorage.getItem('clash-card-tracker-v1')); stored.cards = {}; stored.updatedAt = new Date().toISOString(); localStorage.setItem('clash-card-tracker-v1', JSON.stringify(stored)); localStorage.setItem('clash-card-tracker-language', 'pt-BR'); location.reload(); return true; })()",
  );
  await waitFor(
    "document.querySelector('button[aria-label=\"Abrir menu da conta\"]') && document.querySelector('header [role=status]')?.textContent.trim().length > 10",
  );
  assert.equal(
    await evaluate(
      "document.querySelector('nav a[href=\"/\"]')?.innerText.includes('Coleção') && document.querySelector('nav a[href=\"/comunidade\"]')?.innerText.includes('Comunidade')",
    ),
    true,
  );
  assert.equal(
    await evaluate("Boolean(document.querySelector('nav a[href=\"/\"] svg'))"),
    true,
  );
  for (const width of [320, 360, 375, 390, 412, 430, 480, 768, 1024])
    await assertNoHorizontalOverflow(width, "authenticated collection");
  await screenshot("smoke-authenticated-1024.png");
  await setViewport(320, 844, true);
  await screenshot("smoke-authenticated-320.png");
  assert.equal(await clickButton("Abrir menu da conta"), true);
  await waitFor(
    "document.querySelector('[role=menu]')?.innerText.includes('Editar perfil')",
  );
  assert.equal(
    await evaluate("document.documentElement.scrollWidth <= window.innerWidth"),
    true,
  );
  await screenshot("smoke-authenticated-account-320.png");
  await send("Fetch.disable");

  assert.deepEqual(
    runtimeErrors,
    [],
    `runtime errors: ${runtimeErrors.join("; ")}`,
  );
  assert.equal(
    await evaluate(
      "performance.getEntriesByType('resource').filter((resource) => resource.name.includes('service_role')).length",
    ),
    0,
  );
  socket.close();
  console.log(
    "✓ Smoke browser: pt-BR/en, 9 larguras, visitante/autenticado, navegação, autofill, metadados sociais e comunidade",
  );
} finally {
  chromeProcess.kill();
}
