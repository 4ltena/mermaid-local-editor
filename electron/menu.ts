import { Menu } from "electron";
import type { MenuItemConstructorOptions } from "electron";

const LABELS = {
  en: { view: "View" },
  ja: { view: "表示" },
} as const;

export function buildMenu(isDev: boolean, locale: "en" | "ja"): void {
  const L = LABELS[locale] ?? LABELS.en;
  const isMac = process.platform === "darwin";
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: "appMenu" } as MenuItemConstructorOptions] : []),
    { role: "fileMenu" },
    { role: "editMenu" },
    {
      label: L.view,
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
