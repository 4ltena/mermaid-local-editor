# Electron Cross-Platform Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Tauri(Rust) shell with an Electron(TS/JS) shell, reuse the existing web frontend, ship native apps for macOS/Windows/Linux(Arch/Alma/Ubuntu) via GitHub CI/CD, and switch the accent color to a muted indigo.

**Architecture:** The web core (`src/` TS + CodeMirror + mermaid) is reused unchanged. A thin Electron main process creates a window that loads the renderer from the Vite dev server in development and from a custom `app://` protocol (serving the built `out/renderer`) in production. `electron-vite` builds main/preload/renderer; `electron-builder` packages per OS; GitHub Actions builds and publishes releases on `v*` tags.

**Tech Stack:** Electron, electron-vite, electron-builder, Vite 6, TypeScript 5.7, vitest (one unit test for the protocol path resolver), mermaid 11, CodeMirror 6.

## Global Constraints

- App identifier: `app.mermaid.localeditor` (verbatim, matches old Tauri config).
- Product name: `Mermaid Local Editor`.
- Window: width 1280, height 800, minWidth 640, minHeight 480, resizable.
- Node version: 24 (local + CI).
- Security: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- Production CSP: `default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'`.
- Accent color: light `#6366a8`, dark `#9a9de0`.
- Linux distro mapping: Ubuntu=`deb`, AlmaLinux=`rpm`, Arch=`pacman`; `AppImage` as the universal fallback.
- Release is tag-driven (`v*`) via GitHub Actions; version is the single source of truth in `package.json`.
- Commit author is the repo's configured identity (`4ltena <altena.celestia@gmail.com>`); every commit message ends with a blank line then `Co-Authored-By: Claude <noreply@anthropic.com>`.
- Work happens on branch `feat/electron-cross-platform` (already created).

---

### Task 1: Remove Tauri, add Electron toolchain, rewire package.json

**Files:**
- Delete: `src-tauri/` (entire directory), `vite.config.ts`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: npm scripts `dev`, `build`, `typecheck`, `test`, `dist`, `dist:mac|win|linux`, `icon`; `package.json` `main` = `out/main/index.js`; devDeps `electron`, `electron-vite`, `electron-builder`, `vitest`, `@types/node`.

- [ ] **Step 1: Delete the Tauri shell and old vite config**

```bash
git rm -r src-tauri
rm -f vite.config.ts            # settings move into electron.vite.config.ts (Task 3)
rm -rf src-tauri/target out release   # ignore errors; build artifacts
```

- [ ] **Step 2: Replace `package.json` contents**

```json
{
  "name": "mermaid-local-editor",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "out/main/index.js",
  "description": "A local, cross-platform Mermaid diagram editor (mermaid.live for the desktop), built with Electron + Vite.",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "typecheck": "tsc -p tsconfig.json --noEmit && tsc -p tsconfig.node.json --noEmit",
    "test": "vitest run",
    "preview": "electron-vite preview",
    "dist": "electron-vite build && electron-builder",
    "dist:mac": "electron-vite build && electron-builder --mac",
    "dist:win": "electron-vite build && electron-builder --win",
    "dist:linux": "electron-vite build && electron-builder --linux",
    "icon": "node scripts/gen-icon.mjs"
  },
  "devDependencies": {
    "@codemirror/commands": "^6.6.2",
    "@codemirror/language": "^6.10.6",
    "@codemirror/state": "^6.5.0",
    "@codemirror/view": "^6.36.1",
    "@types/node": "^22.10.0",
    "codemirror": "^6.0.1",
    "electron": "^33.2.0",
    "electron-builder": "^25.1.8",
    "electron-vite": "^5.0.0",
    "mermaid": "^11.4.1",
    "typescript": "^5.7.3",
    "vite": "^6.0.7",
    "vitest": "^2.1.8"
  }
}
```

Note: mermaid/codemirror move from `dependencies` to `devDependencies` because Vite bundles them into `out/renderer`; this keeps them out of the packaged `node_modules`. `dependencies` is intentionally empty.

- [ ] **Step 3: Update `.gitignore`**

Replace the file contents with:

```gitignore
# dependencies
node_modules/

# build output
out/
release/
dist/

# macOS
.DS_Store
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: completes; `node_modules/.bin/electron-vite` and `node_modules/.bin/electron-builder` exist.

- [ ] **Step 5: Verify Tauri is fully gone**

Run: `grep -ri "tauri" package.json src/ index.html || echo "no tauri refs"`
Expected: `no tauri refs`

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(printf 'build: replace Tauri toolchain with Electron\n\nCo-Authored-By: Claude <noreply@anthropic.com>')"
```

---

### Task 2: Protocol path resolver (pure, TDD)

This is the one piece of real logic (map an `app://` URL to a file inside the renderer root, with traversal protection). It imports only `node:path`, so it is unit-testable without Electron.

**Files:**
- Create: `electron/path-resolver.ts`
- Create: `test/path-resolver.test.ts`
- Create: `tsconfig.node.json`

**Interfaces:**
- Consumes: nothing.
- Produces: `resolveRendererPath(root: string, requestUrl: string): string | null` — returns the absolute file path inside `root`, mapping `/` to `index.html`; returns `null` when the path escapes `root`.

- [ ] **Step 1: Create `tsconfig.node.json` (so electron/ type-checks with Node libs)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "types": ["node"]
  },
  "include": ["electron"]
}
```

- [ ] **Step 2: Write the failing test**

Create `test/path-resolver.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { resolveRendererPath } from "../electron/path-resolver";

const root = "/app/out/renderer";

describe("resolveRendererPath", () => {
  it("maps the root request to index.html", () => {
    expect(resolveRendererPath(root, "app://app/")).toBe(join(root, "index.html"));
  });

  it("maps an asset path under the root", () => {
    expect(resolveRendererPath(root, "app://app/assets/x.js")).toBe(
      join(root, "assets", "x.js"),
    );
  });

  it("decodes percent-encoded paths", () => {
    expect(resolveRendererPath(root, "app://app/a%20b.js")).toBe(
      join(root, "a b.js"),
    );
  });

  it("returns null for a traversal attempt", () => {
    expect(resolveRendererPath(root, "app://app/../../etc/passwd")).toBeNull();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run test/path-resolver.test.ts`
Expected: FAIL — cannot resolve `../electron/path-resolver` (file does not exist yet).

- [ ] **Step 4: Write the implementation**

Create `electron/path-resolver.ts`:

```ts
import { join, normalize, sep } from "node:path";

/**
 * Resolve an `app://` request URL to an absolute file path inside `root`.
 * Maps the bare root to `index.html`. Returns `null` if the resolved path
 * would escape `root` (directory-traversal protection).
 */
export function resolveRendererPath(root: string, requestUrl: string): string | null {
  const { pathname } = new URL(requestUrl);
  let rel = decodeURIComponent(pathname);
  if (rel === "/" || rel === "") rel = "/index.html";
  const resolved = normalize(join(root, rel));
  const rootWithSep = root.endsWith(sep) ? root : root + sep;
  if (resolved !== root && !resolved.startsWith(rootWithSep)) return null;
  return resolved;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run test/path-resolver.test.ts`
Expected: PASS (4 passed).

- [ ] **Step 6: Commit**

```bash
git add electron/path-resolver.ts test/path-resolver.test.ts tsconfig.node.json
git commit -m "$(printf 'feat: add app:// renderer path resolver with traversal guard\n\nCo-Authored-By: Claude <noreply@anthropic.com>')"
```

---

### Task 3: electron-vite config + main process + preload + dev window

End state: `npm run dev` opens an Electron window showing the live editor via the dev server.

**Files:**
- Create: `electron.vite.config.ts`
- Create: `electron/main.ts`
- Create: `electron/preload.ts`

**Interfaces:**
- Consumes: nothing yet (protocol/menu/downloads added in later tasks via additional imports).
- Produces: `electron/main.ts` default app entry; renderer dev URL via `process.env.ELECTRON_RENDERER_URL` (set by electron-vite); preload built to `out/preload/index.cjs`.

- [ ] **Step 1: Create `electron.vite.config.ts`**

```ts
import { resolve } from "node:path";
import { defineConfig } from "electron-vite";

export default defineConfig({
  main: {
    build: {
      outDir: "out/main",
      lib: { entry: "electron/main.ts" },
      rollupOptions: { output: { format: "es" } },
    },
  },
  preload: {
    build: {
      outDir: "out/preload",
      lib: { entry: "electron/preload.ts" },
      // Sandboxed preload must be CommonJS.
      rollupOptions: { output: { format: "cjs", entryFileNames: "index.cjs" } },
    },
  },
  renderer: {
    root: ".",
    base: "./",
    build: {
      outDir: "out/renderer",
      target: "es2021",
      rollupOptions: { input: resolve(__dirname, "index.html") },
    },
  },
});
```

- [ ] **Step 2: Create the minimal preload**

Create `electron/preload.ts`:

```ts
// No privileged bridge is required: the renderer uses only standard web APIs
// (clipboard, blob downloads). This file exists so a sandboxed, contextIsolated
// preload is present and can be extended later.
export {};
```

- [ ] **Step 3: Create the main process**

Create `electron/main.ts`:

```ts
import { join } from "node:path";
import { app, BrowserWindow } from "electron";

const isDev = !app.isPackaged;

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 640,
    minHeight: 480,
    backgroundColor: "#1e1f23",
    title: "Mermaid Local Editor",
    webPreferences: {
      preload: join(import.meta.dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (isDev && devUrl) {
    void win.loadURL(devUrl);
  } else {
    void win.loadURL("app://app/index.html");
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
```

Note: `import.meta.dirname` requires Node ≥20.11 (we run Node 24). In production the `app://` load fails until Task 4 registers the protocol — that is expected; this task is validated in dev mode.

- [ ] **Step 4: Type-check**

Run: `npm run typecheck`
Expected: PASS (no errors). If `import.meta.dirname` errors, confirm `tsconfig.node.json` has `"module": "ESNext"` and `"types": ["node"]`.

- [ ] **Step 5: Launch the dev app and confirm the editor renders**

Run: `npm run dev`
Expected: an Electron window titled "Mermaid Local Editor" opens showing the CodeMirror editor on the left and a rendered flowchart on the right. Close the window to end.

- [ ] **Step 6: Commit**

```bash
git add electron.vite.config.ts electron/main.ts electron/preload.ts
git commit -m "$(printf 'feat: add electron-vite config and main process (dev window)\n\nCo-Authored-By: Claude <noreply@anthropic.com>')"
```

---

### Task 4: `app://` protocol for production loading

End state: a production build loads the renderer over `app://` with ESM and mermaid's dynamic imports working.

**Files:**
- Create: `electron/protocol.ts`
- Modify: `electron/main.ts`

**Interfaces:**
- Consumes: `resolveRendererPath` from Task 2.
- Produces: `registerAppScheme(): void` (call before app ready) and `handleAppProtocol(): void` (call after app ready); scheme constant `APP_SCHEME = "app"`.

- [ ] **Step 1: Create `electron/protocol.ts`**

```ts
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { protocol, net } from "electron";
import { resolveRendererPath } from "./path-resolver";

export const APP_SCHEME = "app";

/** Must be called at top level, before `app` is ready. */
export function registerAppScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: APP_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
    },
  ]);
}

/** Must be called after `app` is ready. */
export function handleAppProtocol(): void {
  const rendererRoot = join(import.meta.dirname, "../renderer");
  protocol.handle(APP_SCHEME, (request) => {
    const filePath = resolveRendererPath(rendererRoot, request.url);
    if (!filePath) return new Response("Not found", { status: 404 });
    return net.fetch(pathToFileURL(filePath).toString());
  });
}
```

- [ ] **Step 2: Wire the protocol into `electron/main.ts`**

Add the import at the top of `electron/main.ts`:

```ts
import { registerAppScheme, handleAppProtocol } from "./protocol";
```

Add a top-level call (after imports, before `createWindow`):

```ts
registerAppScheme();
```

Inside `app.whenReady().then(() => { ... })`, add `handleAppProtocol();` as the first line:

```ts
app.whenReady().then(() => {
  handleAppProtocol();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
```

- [ ] **Step 3: Build for production**

Run: `npm run build`
Expected: builds `out/main`, `out/preload`, `out/renderer` with no errors.

- [ ] **Step 4: Launch the built app and confirm production load works**

Run: `npx electron-vite preview`
Expected: the window opens loading `app://app/index.html`; the flowchart renders. Switch the "サンプル" dropdown to "マインドマップ" — it renders too (this exercises mermaid's dynamic `import()` of a diagram chunk over `app://`, which would fail under `file://`).

- [ ] **Step 5: Commit**

```bash
git add electron/protocol.ts electron/main.ts
git commit -m "$(printf 'feat: serve renderer over app:// custom protocol in production\n\nCo-Authored-By: Claude <noreply@anthropic.com>')"
```

---

### Task 5: Security hardening (production CSP)

End state: production responses carry a strict CSP and mermaid still renders without console violations.

**Files:**
- Create: `electron/security.ts`
- Modify: `electron/main.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `applyProductionCsp(): void` — attaches the CSP response header to the default session.

- [ ] **Step 1: Create `electron/security.ts`**

```ts
import { session } from "electron";

const CSP =
  "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'";

/**
 * Apply the production CSP to every response. Not used in dev because the Vite
 * HMR client needs inline scripts and a websocket connection.
 */
export function applyProductionCsp(): void {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "content-security-policy": [CSP],
      },
    });
  });
}
```

- [ ] **Step 2: Wire into `electron/main.ts`**

Add the import:

```ts
import { applyProductionCsp } from "./security";
```

Inside `app.whenReady().then(...)`, before `handleAppProtocol();`, add:

```ts
  if (!isDev) applyProductionCsp();
```

- [ ] **Step 3: Build and launch with the devtools console open to check for CSP violations**

Run: `npm run build && npx electron-vite preview`
Then in the app, open the menu **View → Toggle Developer Tools** (or it is available after Task 6's menu; for now press `Cmd+Option+I` / `Ctrl+Shift+I`). Switch samples through flowchart, sequence, gantt, mindmap.
Expected: each diagram renders; the Console shows **no** `Content Security Policy` violation errors. If a violation appears for styles, confirm `style-src 'self' 'unsafe-inline'` is present (mermaid injects inline styles).

- [ ] **Step 4: Commit**

```bash
git add electron/security.ts electron/main.ts
git commit -m "$(printf 'feat: apply strict CSP to production responses\n\nCo-Authored-By: Claude <noreply@anthropic.com>')"
```

---

### Task 6: Application menu + export downloads

End state: a standard menu exists (so copy/paste/quit shortcuts work), and SVG/PNG export opens a Save dialog.

**Files:**
- Create: `electron/menu.ts`
- Create: `electron/downloads.ts`
- Modify: `electron/main.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `buildMenu(isDev: boolean): void`; `setupDownloads(): void`.

- [ ] **Step 1: Create `electron/menu.ts`**

```ts
import { Menu } from "electron";
import type { MenuItemConstructorOptions } from "electron";

export function buildMenu(isDev: boolean): void {
  const isMac = process.platform === "darwin";
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: "appMenu" } as MenuItemConstructorOptions] : []),
    { role: "fileMenu" },
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        ...(isDev
          ? ([{ type: "separator" }, { role: "toggleDevTools" }, { role: "reload" }] as MenuItemConstructorOptions[])
          : []),
      ],
    },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
```

- [ ] **Step 2: Create `electron/downloads.ts`**

```ts
import { session } from "electron";

/**
 * The renderer triggers SVG/PNG export with an `<a download>` blob URL.
 * Electron turns that into a download; we open a Save dialog with the
 * renderer-supplied filename as the default.
 */
export function setupDownloads(): void {
  session.defaultSession.on("will-download", (_event, item) => {
    item.setSaveDialogOptions({ defaultPath: item.getFilename() });
  });
}
```

- [ ] **Step 3: Wire into `electron/main.ts`**

Add imports:

```ts
import { buildMenu } from "./menu";
import { setupDownloads } from "./downloads";
```

Inside `app.whenReady().then(...)`, after `handleAppProtocol();` and before `createWindow();`, add:

```ts
  setupDownloads();
  buildMenu(isDev);
```

- [ ] **Step 4: Build, launch, and verify export + copy**

Run: `npm run build && npx electron-vite preview`
Then:
1. Click **SVG** → a Save dialog appears with a default name like `mermaid-YYYYMMDD-HHMMSS.svg`. Save it; confirm the file exists and opens as a valid SVG.
2. Click **PNG** → Save dialog with `.png`; save and confirm it is a white-background raster of the diagram.
3. Click **コピー** → status bar shows "コードをコピーしました"; paste into any text field to confirm the editor source was copied (clipboard works because `app://` is a secure context).

Expected: all three succeed.

- [ ] **Step 5: Commit**

```bash
git add electron/menu.ts electron/downloads.ts electron/main.ts
git commit -m "$(printf 'feat: add app menu and save-dialog export downloads\n\nCo-Authored-By: Claude <noreply@anthropic.com>')"
```

---

### Task 7: Muted-indigo accent color

End state: the UI accent is muted indigo in both light and dark themes.

**Files:**
- Modify: `src/styles.css:8` (light accent), `src/styles.css:25` (dark accent)

**Interfaces:**
- Consumes: nothing.
- Produces: CSS variables only; no JS interface change.

- [ ] **Step 1: Change the light-theme accent**

In `src/styles.css`, in the `:root { ... }` block, change:

```css
  --accent: #7b3fe4;
```

to:

```css
  --accent: #6366a8;
```

(`--accent-text: #ffffff;` stays — white text on `#6366a8` has sufficient contrast.)

- [ ] **Step 2: Change the dark-theme accent**

In `src/styles.css`, in the `:root[data-ui-theme="dark"] { ... }` block, change:

```css
  --accent: #a06bff;
```

to:

```css
  --accent: #9a9de0;
```

(`--accent-text: #14151a;` stays — dark text on `#9a9de0` keeps contrast.)

- [ ] **Step 3: Build and visually confirm the new accent**

Run: `npm run build && npx electron-vite preview`
Expected: the brand title, the SVG/PNG/コピー buttons, and hover borders are now muted indigo (not vivid purple). Toggle the 🌙/☀️ button to confirm both themes.

- [ ] **Step 4: Commit**

```bash
git add src/styles.css
git commit -m "$(printf 'feat: switch accent color to muted indigo\n\nCo-Authored-By: Claude <noreply@anthropic.com>')"
```

---

### Task 8: App icon (muted indigo, single source PNG)

End state: a 1024×1024 `build/icon.png` exists in muted indigo; electron-builder derives per-OS icons from it.

**Files:**
- Modify: `scripts/gen-icon.mjs` (color + output path)
- Create: `build/icon.png` (generated artifact, committed)

**Interfaces:**
- Consumes: nothing.
- Produces: `build/icon.png` (1024×1024 RGBA).

- [ ] **Step 1: Update the icon generator color and output path**

In `scripts/gen-icon.mjs`:

Change:

```js
const BG = [123, 63, 228]; // accent purple
```

to:

```js
const BG = [99, 102, 168]; // muted indigo (#6366a8)
```

Change the output block near the end:

```js
const here = dirname(fileURLToPath(import.meta.url));
const out = `${here}/../src-tauri/app-icon.png`;
```

to:

```js
const here = dirname(fileURLToPath(import.meta.url));
const out = `${here}/../build/icon.png`;
```

- [ ] **Step 2: Generate the icon**

Run: `npm run icon`
Expected: prints `wrote .../build/icon.png <bytes> bytes`; `build/icon.png` exists.

- [ ] **Step 3: Verify dimensions**

Run: `sips -g pixelWidth -g pixelHeight build/icon.png`
Expected: `pixelWidth: 1024` and `pixelHeight: 1024`.

- [ ] **Step 4: Commit**

```bash
git add scripts/gen-icon.mjs build/icon.png
git commit -m "$(printf 'feat: muted-indigo app icon source (build/icon.png)\n\nCo-Authored-By: Claude <noreply@anthropic.com>')"
```

---

### Task 9: electron-builder config + local macOS build & run test

End state: `npm run dist:mac` produces a `.dmg` and `.app`; the `.app` launches, renders mermaid, and shows the muted-indigo accent — fulfilling the "test動作" goal on this Mac.

**Files:**
- Create: `electron-builder.yml`

**Interfaces:**
- Consumes: `out/**` from `electron-vite build`, `build/icon.png` from Task 8.
- Produces: packaged apps under `release/`.

- [ ] **Step 1: Create `electron-builder.yml`**

```yaml
appId: app.mermaid.localeditor
productName: Mermaid Local Editor
directories:
  output: release
  buildResources: build
files:
  - out/**
  - package.json
publish:
  provider: github
mac:
  target:
    - dmg
    - zip
  category: public.app-category.developer-tools
  icon: build/icon.png
win:
  target:
    - nsis
  icon: build/icon.png
linux:
  target:
    - AppImage
    - deb
    - rpm
    - pacman
  category: Development
  icon: build/icon.png
```

- [ ] **Step 2: Build the macOS package**

Run: `npm run dist:mac`
Expected: completes; `release/` contains `Mermaid Local Editor-0.1.0-arm64.dmg`, a `-arm64-mac.zip`, and `release/mac-arm64/Mermaid Local Editor.app`. (electron-builder converts `build/icon.png` to `.icns` automatically. If it errors that an `.icns` is required, generate one on this Mac: `mkdir -p build/icon.iconset && for s in 16 32 128 256 512; do sips -z $s $s build/icon.png --out build/icon.iconset/icon_${s}x${s}.png >/dev/null; sips -z $((s*2)) $((s*2)) build/icon.png --out build/icon.iconset/icon_${s}x${s}@2x.png >/dev/null; done && iconutil -c icns build/icon.iconset -o build/icon.icns` then set `mac.icon: build/icon.icns` and rebuild.)

- [ ] **Step 3: Launch the built `.app` and confirm it runs**

Run:
```bash
open "release/mac-arm64/Mermaid Local Editor.app"
pgrep -fl "Mermaid Local Editor" || echo "NOT RUNNING"
```
Expected: the window opens; `pgrep` prints the process. Visually confirm: editor + rendered flowchart, muted-indigo buttons. Switch a couple of samples to confirm dynamic diagrams render. (Because the app is unsigned, first launch may require right-click → Open to pass Gatekeeper.)

- [ ] **Step 4: Commit**

```bash
git add electron-builder.yml
git commit -m "$(printf 'build: add electron-builder config for mac/win/linux targets\n\nCo-Authored-By: Claude <noreply@anthropic.com>')"
```

---

### Task 10: GitHub Actions release workflow (CI/CD)

End state: pushing a `v*` tag builds all three OSes and publishes the native apps to a GitHub Release.

**Files:**
- Create: `.github/workflows/release.yml`

**Interfaces:**
- Consumes: the npm scripts and electron-builder config from prior tasks.
- Produces: a tag-triggered release pipeline.

- [ ] **Step 1: Create `.github/workflows/release.yml`**

```yaml
name: release

on:
  push:
    tags: ["v*"]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  release:
    strategy:
      fail-fast: false
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm

      - run: npm ci

      - name: Build renderer/main/preload
        run: npm run build

      # electron-builder auto-detects the host OS and builds its targets,
      # then publishes the artifacts to the GitHub Release for this tag.
      - name: Package and publish
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: npx electron-builder --publish always
```

Note (alternative if concurrent publishers race on the same release): drop `--publish always`, add `npx electron-builder --publish never` + `actions/upload-artifact@v4` per job, then a final `needs: release` job that downloads all artifacts and creates one release with `softprops/action-gh-release@v2`. Default above is simpler and works for unsigned builds.

- [ ] **Step 2: Validate the workflow YAML locally**

Run: `npx --yes js-yaml .github/workflows/release.yml >/dev/null && echo "yaml ok"`
Expected: `yaml ok` (no parse error).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "$(printf 'ci: add tag-driven release workflow for mac/win/linux\n\nCo-Authored-By: Claude <noreply@anthropic.com>')"
```

---

### Task 11: PR check workflow + README + final verification

End state: a CI check runs typecheck/test/build on every push/PR, and the README documents run/build/release.

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `README.md`

**Interfaces:**
- Consumes: npm scripts.
- Produces: docs + a check pipeline.

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: ci

on:
  push:
    branches: ["**"]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

- [ ] **Step 2: Create `README.md`**

```markdown
# Mermaid Local Editor

A fully local, cross-platform Mermaid diagram editor (a desktop mermaid.live),
built with Electron + Vite + TypeScript. CodeMirror editor with live preview,
themes, pan/zoom, SVG/PNG export, and localStorage persistence. No network
access required — mermaid and CodeMirror are bundled.

## Develop

```bash
npm install
npm run dev        # launches the Electron app with HMR
```

## Quality

```bash
npm run typecheck  # tsc for renderer + electron
npm test           # vitest (path-resolver unit test)
npm run build      # electron-vite build -> out/
```

## Package (local)

```bash
npm run dist:mac   # release/*.dmg, *.zip, *.app   (run on macOS)
npm run dist:win   # release/*.exe (nsis)           (run on Windows)
npm run dist:linux # release/*.AppImage, *.deb, *.rpm, *.pacman (run on Linux)
```

Native apps can only be built on their own OS. Use CI for cross-platform.

## Release (CI/CD)

Releases are produced by GitHub Actions on a version tag:

```bash
# bump "version" in package.json to match, then:
git tag v0.1.0
git push origin v0.1.0
```

`.github/workflows/release.yml` builds macOS (dmg/zip), Windows (nsis), and
Linux (AppImage/deb/rpm/pacman) and publishes them to the GitHub Release.
Linux mapping: Ubuntu=`.deb`, AlmaLinux=`.rpm`, Arch=`pacman` (AppImage is the
universal fallback). Builds are currently unsigned.
```

- [ ] **Step 3: Full verification sweep**

Run:
```bash
npm run typecheck && npm test && npm run build && echo "ALL GREEN"
```
Expected: ends with `ALL GREEN`.

- [ ] **Step 4: Validate the ci.yml YAML**

Run: `npx --yes js-yaml .github/workflows/ci.yml >/dev/null && echo "yaml ok"`
Expected: `yaml ok`.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci.yml README.md
git commit -m "$(printf 'ci: add PR checks; docs: add README\n\nCo-Authored-By: Claude <noreply@anthropic.com>')"
```

---

## Self-Review

**Spec coverage:**
- §3 Electron migration → Tasks 1,3. Tauri removal → Task 1.
- §4 architecture / components → Tasks 3,4,5,6 (main, protocol, security, menu, downloads).
- §5 app:// privileged scheme + ESM/dynamic-import + CSP + webPreferences → Tasks 4,5.
- §6 export downloads / clipboard / menu / window → Tasks 6,3.
- §7 dev vs prod via electron-vite (`ELECTRON_RENDERER_URL`) → Tasks 3,4.
- §8 project structure (remove src-tauri, add electron/, configs) → Tasks 1,3,9,10,11.
- §9 packaging targets (dmg/zip, nsis, AppImage/deb/rpm/pacman) → Task 9.
- §10 build/release CI/CD on `v*` to GitHub Releases → Tasks 10,11.
- §11 muted-indigo accent → Task 7; icon → Task 8.
- §12 testing/verification → unit test (Task 2), build/launch/render checks (Tasks 3–9), CI (Tasks 10,11).
- §13/§14 risks/removals → addressed (unsigned note in Tasks 9,10,11; Tauri removed Task 1).
- All covered; no gaps.

**Placeholder scan:** No TBD/TODO; every code/config step has full content; commands have expected output. Clean.

**Type consistency:** `resolveRendererPath(root, requestUrl)` defined in Task 2 and called identically in Task 4. `APP_SCHEME`/`registerAppScheme`/`handleAppProtocol` defined in Task 4 and called in Task 4's main edit. `buildMenu(isDev)` / `setupDownloads()` / `applyProductionCsp()` signatures match their call sites in `main.ts`. Preload output `index.cjs` matches the `webPreferences.preload` path. Consistent.
