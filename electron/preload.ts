import { contextBridge, ipcRenderer } from "electron";

type CommandPayload = { type: string; path?: string };

contextBridge.exposeInMainWorld("api", {
  showOpenDialog: () => ipcRenderer.invoke("dialog:open"),
  readFile: (path: string) => ipcRenderer.invoke("file:read", path),
  showSaveDialog: (suggestedName: string) => ipcRenderer.invoke("dialog:save", suggestedName),
  writeFile: (path: string, content: string) => ipcRenderer.invoke("file:write", path, content),
  confirmUnsaved: (filename: string, labels: unknown) =>
    ipcRenderer.invoke("dialog:confirm-unsaved", filename, labels),
  setActiveDoc: (path: string | null, addToRecent: boolean) =>
    ipcRenderer.send("doc:active", { path, addToRecent }),
  removeRecent: (path: string) => ipcRenderer.send("recent:remove", path),
  getStartupPath: () => ipcRenderer.invoke("startup:path"),
  setTitle: (title: string) => ipcRenderer.send("window:title", title),
  allowClose: () => ipcRenderer.send("allow-close"),
  onCommand: (cb: (payload: CommandPayload) => void) => {
    ipcRenderer.on("command", (_e, payload: CommandPayload) => cb(payload));
  },
});
