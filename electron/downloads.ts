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
