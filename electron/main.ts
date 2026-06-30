import { join } from "node:path";
import { app, BrowserWindow, ipcMain } from "electron";
import { setupFiles, approvePaths } from "./files";
import { loadState, saveState, addRecent, type AppState } from "./recent";
import { registerAppScheme, handleAppProtocol } from "./protocol";
import { applyProductionCsp } from "./security";
import { buildMenu } from "./menu";
import { setupDownloads } from "./downloads";

const isDev = !app.isPackaged;
const RECENT_MAX = 10;
let appState: AppState = { recent: [], lastPath: null };
let menuLocale = "en";
let forceClose = false;

registerAppScheme();

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

  forceClose = false;
  win.on("close", (e) => {
    if (forceClose) return;
    e.preventDefault();
    win.webContents.send("command", { type: "close-request" });
  });
}

app.whenReady().then(() => {
  if (!isDev) applyProductionCsp();
  handleAppProtocol();
  setupDownloads();
  setupFiles();
  appState = loadState();
  // Approve persisted user-chosen paths so the renderer may reopen them
  // (the file IPC rejects any path the user has not explicitly chosen).
  approvePaths([...appState.recent, ...(appState.lastPath ? [appState.lastPath] : [])]);

  const ol = app.getLocale().toLowerCase();
  menuLocale = ol.startsWith("zh")
    ? /tw|hant|hk|mo/.test(ol)
      ? "zh-TW"
      : "zh-CN"
    : ol.startsWith("ja")
      ? "ja"
      : ol.startsWith("ko")
        ? "ko"
        : ol.startsWith("fr")
          ? "fr"
          : ol.startsWith("es")
            ? "es"
            : ol.startsWith("de")
              ? "de"
              : ol.startsWith("pt")
                ? "pt"
                : ol.startsWith("it")
                  ? "it"
                  : ol.startsWith("ru")
                    ? "ru"
                    : "en";
  buildMenu(isDev, menuLocale, appState.recent);

  ipcMain.handle("startup:path", () => appState.lastPath);

  ipcMain.on("doc:active", (_e, payload: { path: string | null; addToRecent: boolean }) => {
    appState.lastPath = payload.path;
    if (payload.addToRecent && payload.path) {
      appState.recent = addRecent(appState.recent, payload.path, RECENT_MAX);
      app.addRecentDocument(payload.path);
      buildMenu(isDev, menuLocale, appState.recent);
    }
    saveState(appState);
  });

  ipcMain.on("window:title", (e, title: string) => {
    BrowserWindow.fromWebContents(e.sender)?.setTitle(title);
  });

  ipcMain.on("allow-close", () => {
    forceClose = true;
    const win = BrowserWindow.getAllWindows()[0];
    if (win) win.close();
    else app.quit();
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
