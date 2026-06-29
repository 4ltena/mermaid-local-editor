import { join } from "node:path";
import { app, BrowserWindow } from "electron";
import { registerAppScheme, handleAppProtocol } from "./protocol";
import { applyProductionCsp } from "./security";
import { buildMenu } from "./menu";
import { setupDownloads } from "./downloads";

const isDev = !app.isPackaged;

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
}

app.whenReady().then(() => {
  if (!isDev) applyProductionCsp();
  handleAppProtocol();
  setupDownloads();
  const menuLocale = /^ja/i.test(app.getLocale()) ? "ja" : "en";
  buildMenu(isDev, menuLocale);
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
