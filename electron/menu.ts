import { Menu } from "electron";
import type { MenuItemConstructorOptions } from "electron";

const LABELS: Record<string, { view: string }> = {
  en: { view: "View" },
  ja: { view: "表示" },
  "zh-TW": { view: "檢視" },
  "zh-CN": { view: "视图" },
  ko: { view: "보기" },
  fr: { view: "Affichage" },
  es: { view: "Ver" },
  de: { view: "Ansicht" },
  pt: { view: "Visualizar" },
  it: { view: "Visualizza" },
  ru: { view: "Вид" },
};

export function buildMenu(isDev: boolean, locale: string): void {
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
