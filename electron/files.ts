import { ipcMain, dialog, BrowserWindow } from "electron";
import { readFile, writeFile } from "node:fs/promises";

const FILTERS = [
  { name: "Mermaid", extensions: ["mmd"] },
  { name: "All Files", extensions: ["*"] },
];

interface ConfirmLabels {
  message: string;
  save: string;
  discard: string;
  cancel: string;
}

export function setupFiles(): void {
  ipcMain.handle("dialog:open", async () => {
    const win = BrowserWindow.getFocusedWindow() ?? undefined;
    const r = await dialog.showOpenDialog(win!, {
      properties: ["openFile"],
      filters: FILTERS,
    });
    return r.canceled || r.filePaths.length === 0 ? null : r.filePaths[0];
  });

  ipcMain.handle("file:read", async (_e, path: string) => {
    try {
      return { content: await readFile(path, "utf8") };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle("dialog:save", async (_e, suggestedName: string) => {
    const win = BrowserWindow.getFocusedWindow() ?? undefined;
    const r = await dialog.showSaveDialog(win!, {
      defaultPath: suggestedName,
      filters: FILTERS,
    });
    return r.canceled || !r.filePath ? null : r.filePath;
  });

  ipcMain.handle("file:write", async (_e, path: string, content: string) => {
    try {
      await writeFile(path, content, "utf8");
      return { ok: true as const };
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle(
    "dialog:confirm-unsaved",
    async (_e, filename: string, labels: ConfirmLabels) => {
      const win = BrowserWindow.getFocusedWindow() ?? undefined;
      const r = await dialog.showMessageBox(win!, {
        type: "warning",
        message: labels.message,
        detail: filename,
        buttons: [labels.save, labels.discard, labels.cancel],
        defaultId: 0,
        cancelId: 2,
        noLink: true,
      });
      return r.response === 0 ? "save" : r.response === 1 ? "discard" : "cancel";
    },
  );
}
