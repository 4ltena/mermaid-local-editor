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
