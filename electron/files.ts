import { ipcMain, dialog, BrowserWindow } from "electron";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

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

/**
 * Paths the user has explicitly chosen this session (via Open/Save dialogs or
 * the recent-files list). The renderer may only read/write files in this set,
 * so a compromised renderer cannot use the file IPC as an arbitrary
 * read/write primitive.
 */
const approved = new Set<string>();

/** Approve known user-chosen paths (e.g. the persisted recent list + last file). */
export function approvePaths(paths: Iterable<string>): void {
  for (const p of paths) approved.add(resolve(p));
}

export function setupFiles(): void {
  ipcMain.handle("dialog:open", async () => {
    const win = BrowserWindow.getFocusedWindow() ?? undefined;
    const r = await dialog.showOpenDialog(win!, {
      properties: ["openFile"],
      filters: FILTERS,
    });
    if (r.canceled || r.filePaths.length === 0) return null;
    approved.add(resolve(r.filePaths[0]));
    return r.filePaths[0];
  });

  ipcMain.handle("file:read", async (_e, path: string) => {
    if (!approved.has(resolve(path))) return { error: "Unauthorized path" };
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
    if (r.canceled || !r.filePath) return null;
    approved.add(resolve(r.filePath));
    return r.filePath;
  });

  ipcMain.handle("file:write", async (_e, path: string, content: string) => {
    if (!approved.has(resolve(path))) return { error: "Unauthorized path" };
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
